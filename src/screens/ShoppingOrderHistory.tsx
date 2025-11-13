import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { getMemberOrderAppList, updateOrderStatus, insertMemberOrderDetailApp, updateOrderQuantity } from '../api/services/memberOrderAppService';
import { updateMemberOrderAddressUseYn, deleteMemberOrderAddress } from '../api/services/memberOrderAddressService';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import CommonPopup from '../components/CommonPopup';
import CustomToast from '../components/CustomToast';
import { usePopup } from '../hooks/usePopup';
import { cancelPayment } from '../api/services/portoneService';
import { insertMemberReturnApp, updateMemberReturnAppCancelYn, updateMemberReturnApp, updateMemberReturnAppOrderAddressId } from '../api/services/memberReturnAppService';
import { getTargetMemberOrderAddress } from '../api/services/memberOrderAddressService';
import { getCommonCodeList } from '../api/services/commonCodeService';
import { insertMemberPointApp } from '../api/services/memberPointAppService';
import { getMemberOrderAddressList, insertMemberOrderAddress, updateMemberOrderAddressType } from '../api/services/memberOrderAddressService';
import { getTargetMemberShippingAddress, ShippingAddressItem } from '../api/services/memberShippingAddressService';
import Clipboard from '@react-native-clipboard/clipboard';
import Portone from '../components/Portone';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { insertInquiryShoppingApp } from '../api/services/inquiryShoppingAppService';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export const ORDER_STATUS_BADGE_COLOR: Record<string, string> = {
  CANCEL_APPLY: '#BDBDBD',
  CANCEL_COMPLETE: '#F04D4D',
  HOLD: '#BDBDBD',
  PAYMENT_COMPLETE: '#BDBDBD',
  SHIPPINGING: '#202020',
  SHIPPING_COMPLETE: '#42B649',
  PURCHASE_CONFIRM: '#42B649',
  RETURN_APPLY: '#BDBDBD',
  RETURN_GET: '#202020',
  RETURN_COMPLETE: '#F04D4D',
  EXCHANGE_APPLY: '#BDBDBD',
  EXCHANGE_GET: '#202020',
  EXCHANGE_PAYMENT_COMPLETE: '#BDBDBD',
  EXCHANGE_SHIPPINGING: '#202020',
  EXCHANGE_SHIPPING_COMPLETE: '#42B649',
  EXCHANGE_COMPLETE: '#42B649',
};

// YYYYMMDD 또는 YYYYMMDDHHIISS 형태를 Date로 변환
const parseCompactDateTime = (raw: any): Date | null => {
  try {
    const s = (raw ?? '').toString().trim();
    if (!/^\d{8}(\d{6})?$/.test(s)) return null;
    const y = parseInt(s.slice(0, 4), 10);
    const m = parseInt(s.slice(4, 6), 10) - 1;
    const d = parseInt(s.slice(6, 8), 10);
    const hh = s.length >= 10 ? parseInt(s.slice(8, 10), 10) : 0;
    const mm = s.length >= 12 ? parseInt(s.slice(10, 12), 10) : 0;
    const ss = s.length >= 14 ? parseInt(s.slice(12, 14), 10) : 0;
    const dt = new Date(y, m, d, hh, mm, ss);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
};

const isWithinDaysFrom = (raw: any, days: number): boolean => {
  const dt = parseCompactDateTime(raw);
  if (!dt) return false;
  const limit = dt.getTime() + days * 24 * 60 * 60 * 1000;
  return Date.now() <= limit;
};

const ShoppingOrderHistory = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [orderAppList, setOrderAppList] = useState([]);
  const [loading, setLoading] = useState(false);
  // 페이징/리프레시 공통 훅 사용
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { popup, showWarningPopup, showConfirmPopup } = usePopup();
  const [orderStatusTypes, setOrderStatusTypes] = useState<Array<{label: string, value: string}>>([]);
  const [returnReasons, setReturnReasons] = useState<Array<{label: string, value: string}>>([]);
  const [selectedReturnReason, setSelectedReturnReason] = useState<string>('');
  const [showReasonDropdown, setShowReasonDropdown] = useState<boolean>(false);
  const [returnReasonDetail, setReturnReasonDetail] = useState<string>('');
  const [pendingOrderItem, setPendingOrderItem] = useState<any | null>(null);
  const [cancelQuantity, setCancelQuantity] = useState<string>('');
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [inquiryTargetItem, setInquiryTargetItem] = useState<any | null>(null);
  const [pointPopupVisible, setPointPopupVisible] = useState(false);
  const [givePoint, setGivePoint] = useState(0);
  const [orderAddressData, setOrderAddressData] = useState<null>(null);
  const [portoneVisible, setPortoneVisible] = useState(false);
  const [portonePaymentData, setPortonePaymentData] = useState<any | null>(null);
  const [confirmingMap, setConfirmingMap] = useState<Record<number, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [inquiryError, setInquiryError] = useState('');
  // refreshing은 공통 훅 반환값 사용
  // ORDER_STATUS_TYPE 라벨 매핑
  const getOrderStatusLabel = (value: string) => {
    const found = orderStatusTypes.find(t => t.value === value);
    return found ? found.label : value;
  };
  
  // 공통코드: 주문상태 타입 로드
  useEffect(() => {
    const loadOrderStatusTypes = async () => {
      try {
        const res = await getCommonCodeList({ group_code: 'ORDER_STATUS_TYPE' });
        if (res.success && res.data) {
          const types = res.data.map((item: any) => ({
            label: item.common_code_name,
            value: item.common_code,
          }));
          setOrderStatusTypes(types);
        }
      } catch (e) {
        // ignore
      }
    };
    loadOrderStatusTypes();
  }, []);

  const fetchShippingOrderAddress = async () => {
    try {
      let addressIds: number[] = [];

      if (Array.isArray(orderAppList) && orderAppList.length > 0) {
        addressIds = Array.from(new Set(
          orderAppList
            .map((it: any) => Number(it?.order_address_id))
            .filter((n: number) => Number.isFinite(n) && n > 0)
        ));
      } else if (Number(memberInfo?.mem_id)) {
        try {
          const listRes = await getMemberOrderAppList({
            mem_id: Number(memberInfo?.mem_id),
            screen_type: 'ORDER_HISTORY',
          } as any);
          if (listRes?.success && Array.isArray(listRes.data)) {
            addressIds = Array.from(new Set(
              listRes.data
                .map((it: any) => Number(it?.order_address_id))
                .filter((n: number) => Number.isFinite(n) && n > 0)
            ));
          }
        } catch (e) {
          // ignore
        }
      }

      if (!addressIds.length) {
        setOrderAddressData(null);
        return;
      }

      const results = await Promise.all(
        addressIds.map(async (id: number) => {
          try {
            const res = await getTargetMemberOrderAddress({ order_address_id: id });
            return [id, res?.success ? res.data : null] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      const addressMap: Record<number, any> = {};
      for (const [id, data] of results) {
        addressMap[id] = data;
      }

      setOrderAddressData(addressMap);

    } catch (error) {
      console.error('배송지 정보 API 에러:', error);
    }
  };

  // 공통코드: 반품/취소 사유 목록 (팝업 표시 시 로드)
  useEffect(() => {
    const loadReturnReasons = async () => {
      try {
        const res = await getCommonCodeList({ group_code: 'RETURN_REASON_TYPE' });
        if (res.success && res.data) {
          const list = res.data.map((item: any) => ({
            label: item.common_code_name,
            value: item.common_code,
          }));
          setReturnReasons(list);
        }
      } catch (e) {
        setReturnReasons([]);
      }
    };
    if (popup.visible) {
      loadReturnReasons();
    } else {
      setReturnReasons([]);
      setSelectedReturnReason('');
    }
  }, [popup.visible]);

  // 현재 년도 기준 5년전까지 배열 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    ...Array.from({ length: 5 }, (_, i) => ({ value: (currentYear - i).toString(), label: `${currentYear - i}년` }))
  ];

  // 주문 목록 조회 함수
  const fetchOrderList = async () => {
    if (memberInfo?.mem_id) {
      try {
        const params: any = {
          mem_id: memberInfo.mem_id,
          screen_type: 'ORDER_HISTORY'
        };
        
        // selectedYear가 있을 때만 year 파라미터 추가
        if (selectedYear) {
          params.year = selectedYear;
        }

        // 검색은 클라이언트에서 대소문자 구분 없이 필터링 처리
        
        const response = await getMemberOrderAppList(params);
        
        if (response.success) {
          setOrderAppList(response.data || []);
        }
      } catch (error) {
        console.error('주문내역 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 부분 취소 시 무료배송 기준 하락 여부에 따른 추가 배송비 계산
  const computeExtraShippingFeeForCancel = (targetOrderItem: any, qtyToCancel: number): number => {
    try {
      if (!targetOrderItem || !qtyToCancel) return 0;
      const paymentId = targetOrderItem.payment_app_id;
      const groupItems = (Array.isArray(orderAppList) ? orderAppList : []).filter((it: any) => {
        if (String(it?.payment_app_id) !== String(paymentId)) return false;
        const st = String(it?.order_status || '');
        // 잔여 합계 계산에서 완료/신청 상태는 제외
        return ![
          'CANCEL_COMPLETE', 'RETURN_COMPLETE', 'EXCHANGE_COMPLETE',
          'CANCEL_APPLY', 'RETURN_APPLY', 'EXCHANGE_APPLY'
        ].includes(st);
      });

      const sumLine = (it: any) => {
        const price = Number(String(it?.price ?? 0).replace(/,/g, '')) || 0;
        const qty = Number(it?.order_quantity ?? 0) || 0;
        return price * qty;
      };

      const beforeTotal = groupItems.reduce((acc: number, it: any) => acc + sumLine(it), 0);
      const cancelValue = sumLine({ price: targetOrderItem?.price, order_quantity: qtyToCancel });
      const afterTotal = Math.max(0, beforeTotal - cancelValue);

      // 전체 취소(잔여 합계 0)이면 추가 배송비 없음
      if (afterTotal === 0) return 0;

      const threshold = Number(String(targetOrderItem?.free_shipping_amount ?? 0).replace(/,/g, '')) || 0;
      if (!threshold) return 0;

      if (beforeTotal >= threshold && afterTotal < threshold) {
        const baseFee = Number(String(targetOrderItem?.delivery_fee ?? 0).replace(/,/g, '')) || 0;
        const isRemote = Number(targetOrderItem?.extra_shipping_area_cnt ?? 0) > 0;
        const remoteFee = isRemote ? (Number(String(targetOrderItem?.remote_delivery_fee ?? 0).replace(/,/g, '')) || 0) : 0;
        return Math.max(0, baseFee + remoteFee);
      }
      return 0;
    } catch {
      return 0;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchShippingOrderAddress();
      fetchOrderList();
    }, [memberInfo?.mem_id, selectedYear, searchQuery])
  );

  // 검색어 대소문자 무시 필터링 (상품명/브랜드명)
  const normalizedList = React.useMemo(() => {
    try {
      const q = String(searchQuery ?? '').trim().toLowerCase();
      if (!q) return orderAppList;
      return (Array.isArray(orderAppList) ? orderAppList : []).filter((it: any) => {
        const name = String(it?.product_title ?? it?.title ?? it?.product_name ?? '').toLowerCase();
        const brand = String(it?.brand_name ?? '').toLowerCase();
        return name.includes(q) || brand.includes(q);
      });
    } catch {
      return orderAppList;
    }
  }, [orderAppList, searchQuery]);

  // 그룹화: 동일 결제(payment_app_id) 기준으로 묶기 (최신순 보정)
  const groups = React.useMemo(() => {
    try {
      const map = new Map<string, any[]>();
      const orderKeys: string[] = [];
      for (const cur of (Array.isArray(normalizedList) ? normalizedList : [])) {
        const key = String(cur?.payment_app_id ?? '');
        if (!map.has(key)) {
          map.set(key, []);
          orderKeys.push(key);
        }
        map.get(key)!.push(cur);
      }
      const grouped = orderKeys.map(k => map.get(k)!).filter(Boolean);
      const toNum = (v: any) => {
        const n = Number(String(v ?? '').replace(/[^0-9]/g, ''));
        return Number.isFinite(n) ? n : 0;
      };
      const latestValue = (g: any[]) => {
        const maxDt = g.reduce((m: number, it: any) => {
          const dt = parseCompactDateTime(it?.order_dt);
          return Math.max(m, dt ? dt.getTime() : 0);
        }, 0);
        if (maxDt) return maxDt;
        return g.reduce((m: number, it: any) => Math.max(m, toNum(it?.order_app_id)), 0);
      };
      grouped.sort((a, b) => latestValue(b) - latestValue(a));
      return grouped;
    } catch {
      return [] as any[];
    }
  }, [orderAppList]);

  const { displayedItems: displayedGroups, handleScroll, loadingMore } = useInfiniteScroll<any[]>(
    {
      items: groups,
      pageSize: 5,
      isLoading: loading,
      resetDeps: [selectedYear, searchQuery, memberInfo?.mem_id],
    }
  );

  const { refreshing, onRefresh } = usePullToRefresh(
    async () => {
      await Promise.all([
        fetchShippingOrderAddress(),
        fetchOrderList(),
      ]);
    },
    [selectedYear, searchQuery, memberInfo?.mem_id]
  );

  // CANCEL_APPLY + 반품/취소 접수 통합 처리
  const insertCancelApply = async (targetOrderItem: any) => {
    if (!targetOrderItem) return;
    let statusUpdated = false;
    let newOrderAddressId: number | undefined;

    try {
      const paymentAppId = Number(targetOrderItem.payment_app_id);
      if (!paymentAppId) {
        showWarningPopup('결제번호를 확인할 수 없습니다.');
        return;
      }
      const originalQty = Number(targetOrderItem?.order_quantity ?? 0);
      const cancelQty = Number(cancelQuantity);

      if (!cancelQty || cancelQty < 1 || cancelQty > originalQty) {
        showWarningPopup(`유효한 취소 수량을 입력하세요.`);
        return;
      }

      // 1) 취소 수량 만큼 새 주문상세 생성 (분할)
      let newOrderDetailId: number | undefined;
      try {
        const remainderQty = Math.max(0, originalQty - cancelQty);
        if (remainderQty > 0) {
          const newOrderRes = await insertMemberOrderDetailApp({
            order_detail_app_id: Number(targetOrderItem.order_detail_app_id),
            order_app_id: Number(targetOrderItem.order_app_id),
            product_detail_app_id: Number(targetOrderItem.product_detail_app_id),
            order_status: 'PAYMENT_COMPLETE',
            order_quantity: remainderQty,
            order_group: 1,
            mem_id: Number(memberInfo?.mem_id),
          } as any);
          newOrderDetailId = newOrderRes?.order_detail_app_id;
        }
      } catch (e) {
        // 새 주문상세 생성 실패 시에도 기존 건만 처리
      }
      
      // 신규 상세 ID를 못받았을 경우 목록 재조회로 보완 탐색
      if (!newOrderDetailId) {
        try {
          const params: any = {
            mem_id: Number(memberInfo?.mem_id),
            screen_type: 'ORDER_HISTORY'
          };
          if (selectedYear) params.year = selectedYear;
          if (searchQuery) params.search_title = searchQuery;
          const listRes = await getMemberOrderAppList(params);
          if (listRes?.success && Array.isArray(listRes.data)) {
            const candidate = listRes.data.find((it: any) =>
              Number(it.order_app_id) === Number(targetOrderItem.order_app_id) &&
              Number(it.product_detail_app_id) === Number(targetOrderItem.product_detail_app_id) &&
              String(it.order_status) === 'PAYMENT_COMPLETE' &&
              Number(it.order_quantity) === Math.max(0, originalQty - cancelQty)
            );
            if (candidate?.order_detail_app_id) {
              newOrderDetailId = Number(candidate.order_detail_app_id);
            }
          }
        } catch (e) {
          // ignore fallback errors
        }
      }

      // 2) 기존 상세 수량을 취소수량으로 업데이트 (원 상세는 접수 대상)
      try {
        await updateOrderQuantity({
          order_detail_app_id: Number(targetOrderItem.order_detail_app_id),
          mem_id: Number(memberInfo?.mem_id),
          order_quantity: cancelQty,
        } as any);
      } catch (e) {
        // 수량 업데이트 실패시 이후 단계는 진행 (상태 업데이트로 가시적 피드백 보장)
      }
      
      // 3) 새 주문상세의 주문 배송지 인서트 (회원 주문배송지 목록에서 가져오기)
      try {
        const newIdNum = parseInt(String(newOrderDetailId ?? ''), 10);
        console.log('newIdNum', newIdNum);
        if (Number.isFinite(newIdNum) && newIdNum > 0) {
          // 기존 주소를 새로 생성된 주문 상세로 매핑 로직 제거 (요청에 따라 삭제)

          const addrListRes = await getMemberOrderAddressList({ mem_id: Number(memberInfo?.mem_id) });
          const list = Array.isArray(addrListRes?.data) ? addrListRes.data : (addrListRes?.data ? [addrListRes.data] : []);
          const addr = list && list.length > 0 ? list[0] : undefined;

          if (addr) {
            const insertRes = await insertMemberOrderAddress({
              order_detail_app_id: newIdNum,
              order_address_type: 'ORDER',
              mem_id: Number(memberInfo?.mem_id),
              receiver_name: addr.receiver_name,
              receiver_phone: addr.receiver_phone,
              address: addr.address,
              address_detail: addr.address_detail,
              zip_code: addr.zip_code,
              enter_way: addr.enter_way,
              enter_memo: addr.enter_memo,
              delivery_request: addr.delivery_request,
            } as any);
            newOrderAddressId = Number((insertRes && (insertRes.data?.order_address_id ?? insertRes.order_address_id)) || 0) || undefined;
          }
        }
      } catch (e) {
        // 주소 저장 실패는 치명적이지 않음
      }

      // 4) 상태 업데이트: 기존 상세만 CANCEL_APPLY (신규 분할건은 PAYMENT_COMPLETE 유지)
      await updateOrderStatus({
        order_detail_app_ids: [Number(targetOrderItem.order_detail_app_id)],
        mem_id: Number(memberInfo?.mem_id),
        order_status: 'CANCEL_APPLY',
      } as any);
      statusUpdated = true;

      if (!statusUpdated) return;

      // 5) 반품/취소 레코드 기록 (기존 상세 기준으로 연결)
      const targetIdsForReturn = [Number(targetOrderItem.order_detail_app_id)];
      const hasReturnApp = orderAppList.some((it: any) => targetIdsForReturn.includes(Number(it.order_detail_app_id)) && !!it.return_app_id);

      if (hasReturnApp) {
        await updateMemberReturnApp({
          order_detail_app_ids: targetIdsForReturn,
          mem_id: Number(memberInfo?.mem_id),
          quantity: cancelQty,
          cancel_yn: 'N',
          return_reason_type: selectedReturnReason,
          reason: returnReasonDetail || '',
        } as any);
      } else {
        await Promise.all(
          targetIdsForReturn.map((oid: number) =>
            insertMemberReturnApp({
              order_detail_app_id: oid,
              mem_id: Number(memberInfo?.mem_id),
              return_applicator: 'BUYER',
              return_reason_type: selectedReturnReason,
              reason: returnReasonDetail || '',
              quantity: cancelQty,
              order_address_id: Number(targetOrderItem?.order_address_id ?? newOrderAddressId),
            } as any)
          )
        );
      }
    } catch (e) {
      console.log('insertCancelApply error', e);
    }
  };

  // 취소접수 취소 처리 (반품접수 취소 + 상태 복구)
  const cancelCancelApply = async (firstItem: any) => {
    try {
      const targetOrderDetailId = Number(firstItem?.order_detail_app_id);
      if (!targetOrderDetailId) return;

      let statusUpdated = false;
      // 반품/교환 접수 취소 시 선결제 환불 시도 (imp_uid가 제공될 때)
      try {
        const impUid = String((firstItem as any)?.delivery_fee_portone_imp_uid || '').trim();
        if (impUid) {
          const toNum = (v: any) => {
            const n = Number(String(v ?? 0).replace(/[^0-9.-]/g, ''));
            return isNaN(n) ? 0 : n;
          };
          const amount = toNum((firstItem as any)?.total_delivery_fee_amount);
          const deliveryFeePaymentAppId = Number((firstItem as any)?.delivery_fee_payment_app_id);
          const merchantUid = String((firstItem as any)?.delivery_fee_portone_merchant_uid || '').trim();
          await cancelPayment({ imp_uid: impUid, merchant_uid: merchantUid, reason: '반품/교환 접수 취소 환불', amount: amount, payment_app_id: deliveryFeePaymentAppId, mod_id: Number(memberInfo?.mem_id) } as any);
        }
      } catch (e) {
        // 환불 실패는 이후 복구 흐름을 막지 않음
      }
      await updateOrderStatus({
        order_detail_app_ids: [targetOrderDetailId],
        mem_id: Number(memberInfo?.mem_id),
        order_status: ((firstItem?.order_status === 'RETURN_APPLY') || (firstItem?.order_status === 'EXCHANGE_APPLY'))
          ? (firstItem?.purchase_confirm_dt ? 'PURCHASE_CONFIRM' : 'SHIPPING_COMPLETE')
          : 'PAYMENT_COMPLETE',
        order_group: 1,
      } as any);
      statusUpdated = true;

      if (!statusUpdated) return;

      if (firstItem?.order_status === 'RETURN_APPLY' && firstItem?.order_address_id) {
        try {
          await deleteMemberOrderAddress({
            order_detail_app_id: targetOrderDetailId,
            mem_id: Number(memberInfo?.mem_id),
          } as any);
        } catch (e) {
        }

        try {
          let addrDetail = (orderAddressData && typeof orderAddressData === 'object')
            ? (orderAddressData as any)[Number(firstItem?.order_address_id)]
            : undefined;

          // 로컬 맵에 없으면 서버에서 단건 조회로 보완
          if (!addrDetail && Number(firstItem?.order_address_id)) {
            try {
              const singleRes = await getTargetMemberOrderAddress({ order_address_id: Number(firstItem.order_address_id) } as any);
              if (singleRes?.success) {
                addrDetail = singleRes.data;
              }
            } catch (e) {}
          }

          if (addrDetail) {
            const insertRes = await insertMemberOrderAddress({
              order_detail_app_id: targetOrderDetailId,
              mem_id: Number(memberInfo?.mem_id),
              order_address_type: 'ORDER',
              receiver_name: addrDetail.receiver_name,
              receiver_phone: addrDetail.receiver_phone,
              address: addrDetail.address,
              address_detail: addrDetail.address_detail,
              zip_code: addrDetail.zip_code,
              enter_way: addrDetail.enter_way,
              enter_memo: addrDetail.enter_memo,
              delivery_request: addrDetail.delivery_request,
            } as any);

            const newAddrId = Number((insertRes && (insertRes.data?.order_address_id ?? insertRes.order_address_id)) || 0) || undefined;
            if (Number.isFinite(newAddrId) && newAddrId! > 0) {
              try {
                await updateMemberReturnAppOrderAddressId({
                  order_detail_app_id: targetOrderDetailId,
                  order_address_id: Number(newAddrId),
                  mem_id: Number(memberInfo?.mem_id),
                } as any);
              } catch (e) {}
            }
          }
        } catch (e) {}
      }

      await updateMemberReturnAppCancelYn({
        order_detail_app_ids: [targetOrderDetailId],
        mem_id: Number(memberInfo?.mem_id),
        cancel_yn: 'Y',
      } as any);

      await fetchOrderList();
    } catch (e) {
      console.log('cancelCancelApply error', e);
    }
  };
  
  const handleBackPress = () => {
    const state = (navigation as any)?.getState?.();
    const prevRouteName = state?.routes?.[(state?.index ?? 0) - 1]?.name;
    if (prevRouteName === 'ShoppingMypage' || prevRouteName === 'MyPage') {
      (navigation as any)?.goBack?.();
    } else {
      (navigation as any)?.navigate?.('MainTab', { screen: 'Shopping' });
    }
  };

  const displayUnit = (unit: any) => {
    try {
      const u = String(unit ?? '');
      if (!u || u === 'NONE_UNIT') return '';
      if (u.startsWith('SIZE_')) return u.replace(/^SIZE_/, '');
      return u;
    } catch {
      return String(unit ?? '');
    }
  };

  const handleSubmitInquiry = async () => {
    try {
      if (!inquiryText.trim()) {
        setInquiryError('의견을 입력한 후 버튼을 눌러주세요');
        return;
      }
      if (!inquiryTargetItem?.product_app_id) return;
      const res = await insertInquiryShoppingApp({
        product_app_id: Number(inquiryTargetItem.product_app_id),
        content: inquiryText,
        mem_id: memberInfo?.mem_id ? Number(memberInfo.mem_id) : undefined
      } as any);
      if (res?.success) {
        setInquiryText('');
        setToastMessage('소중한 의견이 반영되었습니다.');
        setToastVisible(true);
      } else {
        showWarningPopup('데이터 전송이 실패하였습니다.');
      }
    } catch (e) {
      showWarningPopup('데이터 전송이 실패하였습니다.');
    }
  };

  useEffect(() => {
    // 모달 열고 닫을 때 에러 문구 초기화
    setInquiryError('');
  }, [inquiryModalVisible]);

  return (
    <>
      <CommonHeader 
        title="주문내역"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        onBackPress={handleBackPress}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#40B649" />
          </View>
        ) : (
          <>
            <View style={styles.searchContainer}>
              {!isSearching ? (
                <TouchableOpacity 
                  style={[layoutStyle.rowCenter, styles.searchIconContainer]}
                  onPress={() => setIsSearching(true)}
                >
                  <Image source={IMAGES.icons.searchStrokeBlack} style={styles.searchIcon} />
                  <Text style={styles.searchText}>검색</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.searchInputContainer}>
                  <Image source={IMAGES.icons.searchStrokeBlack} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="검색어를 입력하세요"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) {
                        setIsSearching(false);
                      }
                    }}
                  />
                  <TouchableOpacity onPress={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}>
                    <Text style={styles.cancelText}>취소</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.yearContainer}>
                <TouchableOpacity 
                  style={styles.searchYearContainer}
                  onPress={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <Text>{`${selectedYear}년`}</Text>
                </TouchableOpacity>
                
                {/* 년도 드롭박스 */}
                {showYearDropdown && (
                  <View style={styles.yearDropdown}>
                    {yearOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.yearOption,
                          selectedYear.toString() === option.value && styles.selectedYearOption
                        ]}
                        onPress={() => {
                          setSelectedYear(parseInt(option.value));
                          setShowYearDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.yearOptionText,
                          selectedYear.toString() === option.value && styles.selectedYearOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {
              !orderAppList.length ? (
                <View style={styles.emptyContainer}>
                  <Image source={IMAGES.icons.orderGray} style={styles.speechIcon} />
                  <Text style={styles.emptyText}>주문한 내역이 없어요</Text>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[commonStyle.pb50]}
                  alwaysBounceVertical={true}
                  bounces={true}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#40B649"
                      colors={["#40B649"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {displayedGroups.map((group: any[]) => {
                    const first = group[0];
                    const isSplitGroup = (() => {
                      try {
                        // 동일 결제 내에서 같은 order_app_id가 2개 이상 존재하면 분할된 것으로 간주
                        const counts: Record<string, number> = {};
                        for (const gi of group) {
                          const key = String(gi?.order_app_id ?? '');
                          counts[key] = (counts[key] || 0) + 1;
                          if (counts[key] > 1) return true;
                        }
                        return false;
                      } catch (e) {
                        return false;
                      }
                    })();
                    const groupHasReturnPickup = (() => {
                      try {
                        return (group as any[]).some((it: any) => !!it?.return_goodsflow_id);
                      } catch {
                        return false;
                      }
                    })();

                    return (
                      <View key={`pay_${first.payment_app_id}`} style={styles.orderItem}>
                            <View style={[layoutStyle.rowStart]}>
                          <Text style={styles.orderDate}>{first.order_dt}</Text>
                          {!isSplitGroup && (
                            <View
                              style={[
                                styles.orderStatusContainer
                                , {backgroundColor: groupHasReturnPickup ? '#000000' : (ORDER_STATUS_BADGE_COLOR[first.order_status] || '#BDBDBD')}
                              ]}>
                              <Text style={styles.orderStatusText}>{groupHasReturnPickup ? '반품 수거중' : getOrderStatusLabel(first.order_status)}</Text>
                            </View>
                          )}
                        </View>
                        {group.map((gi: any, index: number) => {
                          return(
                            <View key={`od_${gi.order_detail_app_id || gi.order_app_id}_${index}`}>
                              <View style={[styles.orderItemImgContainer, {borderTopWidth: index == 0 ? 0 : 2, borderTopColor: '#EEEEEE', marginHorizontal: -scale(16), paddingHorizontal: scale(16),}]}>
                                <TouchableOpacity 
                                  style={styles.orderItemImgContainer}
                                  onPress={() => {
                                    const productData = {
                                      product_app_id: gi.product_app_id,
                                      product_detail_app_id: gi.product_detail_app_id,
                                    };
                                    navigation.navigate('ShoppingDetail' as never, { productParams: productData } as never);
                                  }}
                                >
                                  <ShoppingThumbnailImg
                                    productAppId={gi.product_app_id}
                                  />
                                  <View style={[layoutStyle.columnStretchEvenly, {marginLeft: scale(10), flex: 1}]}> 
                                    <View style={[layoutStyle.rowStart, {alignItems: 'center'}]}>
                                      <Text style={styles.productName}>{gi.brand_name}</Text>
                                      {isSplitGroup && (
                                        <View style={[styles.orderStatusContainer, {marginLeft: scale(6), backgroundColor: gi?.return_goodsflow_id ? '#000000' : (ORDER_STATUS_BADGE_COLOR[gi.order_status] || '#BDBDBD')}]}>
                                          <Text style={styles.orderStatusText}>{gi?.return_goodsflow_id ? '반품 수거중' : getOrderStatusLabel(gi.order_status)}</Text>
                                        </View>
                                      )}
                                    </View>
                                    <View style={[layoutStyle.rowStart, {alignItems: 'center'}]}>
                                      <Text style={styles.productTitle} numberOfLines={2} ellipsizeMode="tail">{gi.product_title}</Text>
                                    </View>
                                    <Text style={styles.productInfo}>{gi.option_amount ? gi.option_amount : ''}{gi.option_unit !== 'NONE_UNIT' ? displayUnit(gi.option_unit) + ' ' : ''}{gi.option_gender ? (gi.option_gender == 'W' ? '여성' : gi.option_gender == 'M' ? '남성' : gi.option_gender == 'A' ? '공용' : '') : ''} / {gi.order_quantity}개</Text>
                                  </View>
                                </TouchableOpacity>
                                </View>

                                {!isSplitGroup && (
                                  <View style={[commonStyle.mt10]}>
                                    <View style={[layoutStyle.rowBetween, {alignItems: 'center'}]}>
                                      <Text style={styles.productName}>상품금액</Text>
                                      <Text style={styles.productPrice}>{(Number(String((gi.price) ?? 0).replace(/,/g, '')) * Number((gi.order_quantity) ?? 0)).toLocaleString()}원</Text>
                                    </View>
                                    {Number(gi.total_payment_amount) < Number(gi.free_shipping_amount) && Number(gi.free_shipping_amount) && (
                                      <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                        <Text style={styles.productName}>배송비</Text>
                                        <Text style={styles.productPrice}>{gi.delivery_fee?.toLocaleString()}원</Text>
                                      </View>
                                    )}
                                    {Number(gi.total_delivery_fee_amount) > 0 && (
                                      <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                        <Text style={styles.productName}>{gi.order_status === 'EXCHANGE_COMPLETE' ? '교환' : '반품'} 배송비</Text>
                                        <Text style={styles.productPrice}>{Number(gi.total_delivery_fee_amount)?.toLocaleString()}원</Text>
                                      </View>
                                    )}
                                    {(gi.extra_shipping_area_cnt > 0) && (gi.remote_delivery_fee > 0) && (
                                      <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                        <Text style={styles.productName}>도서산간 배송비</Text>
                                        <Text style={styles.productPrice}>{gi.remote_delivery_fee?.toLocaleString()}원</Text>
                                      </View>
                                    )}
                                    <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                      <Text style={styles.totalPriceText}>총 결제금액</Text>
                                      <Text style={styles.totalPriceText}>{Number(gi.total_payment_amount)?.toLocaleString()}원</Text>
                                    </View>
                                    {(gi.order_status === 'CANCEL_COMPLETE' || gi.order_status === 'RETURN_COMPLETE') && (
                                      <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                        <Text style={styles.totalPriceText}>환불 금액</Text>
                                        <Text style={styles.totalPriceText}>{(
                                          Number(
                                            String(
                                              (gi as any)?.total_refund_amount ?? (gi as any)?.refund_amount ?? (gi as any)?.payment_amount ?? 0
                                            ).replace(/,/g, '')
                                          )
                                        ).toLocaleString()}원</Text>
                                      </View>
                                    )}
                                  </View>
                                )}

                                <View style={[layoutStyle.rowCenter, commonStyle.mt10]}>
                                  {gi?.return_goodsflow_id ? null : gi.order_status === 'PAYMENT_COMPLETE' ? (
                                    <>
                                      <TouchableOpacity
                                        style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                        onPress={() => {
                                          setPendingOrderItem({ ...gi, order_status: 'CANCEL_APPLY' });
                                          setSelectedReturnReason('');
                                          setReturnReasonDetail('');
                                          setShowReasonDropdown(false);
                                          setCancelQuantity('1');
                                          showConfirmPopup('결제를 취소하시겠습니까?', () => {}, () => {});
                                        }}
                                      >
                                        <Text style={styles.bottomBtnText}>결제 취소 접수</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                        setInquiryTargetItem(gi);
                                        setInquiryText('');
                                        setInquiryModalVisible(true);
                                      }}>
                                        <Text style={styles.bottomBtnText}>문의하기</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : gi.order_status === 'SHIPPINGING' ? (
                                    <>
                                      <TouchableOpacity
                                        style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                        onPress={() => navigation.navigate('ShoppingShipping' as never, { item: gi } as never)}
                                      >
                                        <Text style={styles.bottomBtnText}>배송 현황</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                        setInquiryTargetItem(gi);
                                        setInquiryText('');
                                        setInquiryModalVisible(true);
                                      }}>
                                        <Text style={styles.bottomBtnText}>문의하기</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : gi.order_status === 'SHIPPING_COMPLETE' ? (
                                    <>
                                      <TouchableOpacity
                                        style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                        disabled={!!confirmingMap[Number(gi.order_detail_app_id)]}
                                        onPress={async () => {
                                          const odId = Number(gi.order_detail_app_id);
                                          if (confirmingMap[odId]) return;
                                          setConfirmingMap(prev => ({ ...prev, [odId]: true }));
                                          try {
                                            await updateOrderStatus({
                                              order_detail_app_ids: [Number(gi.order_detail_app_id)],
                                              mem_id: Number(memberInfo?.mem_id),
                                              order_status: 'PURCHASE_CONFIRM',
                                            } as any);
                                            // 지급 포인트가 있는 경우 포인트 적립
                                            const givePoint = Number(gi?.give_point ?? 0);
                                            const orderQtyForPoint = Number(gi?.order_quantity ?? 1) || 1;
                                            const totalGivePoint = Math.max(0, givePoint * orderQtyForPoint);
                                            const shouldShowPointPopup = totalGivePoint > 0;
                                            if (shouldShowPointPopup) {
                                              try {
                                                await insertMemberPointApp({
                                                  mem_id: Number(memberInfo?.mem_id),
                                                  order_detail_app_id: Number(gi.order_detail_app_id),
                                                  point_status: 'POINT_ADD',
                                                  point_amount: totalGivePoint,
                                                } as any);
                                                setGivePoint(totalGivePoint);
                                                setPointPopupVisible(true);
                                              } catch (e) {
                                                // 포인트 적립 실패는 UI 흐름에 영향 주지 않음
                                              }
                                            }
                                            await fetchOrderList();
                                          } catch (e) {
                                            // ignore
                                          } finally {
                                            setConfirmingMap(prev => {
                                              const next = { ...prev };
                                              delete next[odId];
                                              return next;
                                            });
                                          }
                                        }}
                                      >
                                        <Text style={styles.bottomBtnText}>구매 확정</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                        onPress={() => navigation.navigate('ShoppingReturn' as never, { item: gi, maxQuantity: gi.order_quantity } as never)}
                                      >
                                        <Text style={styles.bottomBtnText}>반품/교환 요청</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : gi.order_status === 'PURCHASE_CONFIRM' ? (
                                    <>
                                      {isWithinDaysFrom(gi?.purchase_confirm_dt, 3) && (
                                        <TouchableOpacity
                                          style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                          onPress={() => navigation.navigate('ShoppingReturn' as never, { item: gi, maxQuantity: gi.order_quantity } as never)}
                                        >
                                          <Text style={styles.bottomBtnText}>반품/교환 요청</Text>
                                          <Text style={[styles.bottomBtnText, {fontSize: scale(10), fontFamily: 'Pretendard-Regular'}]}>(3일 이내 가능)</Text>
                                        </TouchableOpacity>
                                      )}
                                      <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                        setInquiryTargetItem(gi);
                                        setInquiryText('');
                                        setInquiryModalVisible(true);
                                      }}>
                                        <Text style={styles.bottomBtnText}>문의하기</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : (gi.order_status === 'RETURN_APPLY' || gi.order_status === 'EXCHANGE_APPLY') ? (
                                    <>
                                      <TouchableOpacity
                                        style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                        onPress={() => cancelCancelApply(gi)}
                                      >
                                        <Text style={styles.bottomBtnText}>{gi.order_status === 'EXCHANGE_APPLY' ? '교환접수 취소' : '반품접수 취소'}</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                        setInquiryTargetItem(gi);
                                        setInquiryText('');
                                        setInquiryModalVisible(true);
                                      }}>
                                        <Text style={styles.bottomBtnText}>문의하기</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : gi.order_status === 'CANCEL_APPLY' ? (
                                    <>
                                      <TouchableOpacity
                                        style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                        onPress={() => cancelCancelApply(gi)}
                                      >
                                        <Text style={styles.bottomBtnText}>결제 취소 접수 철회</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                        setInquiryTargetItem(gi);
                                        setInquiryText('');
                                        setInquiryModalVisible(true);
                                      }}>
                                        <Text style={styles.bottomBtnText}>문의하기</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : (gi.order_status === 'CANCEL_COMPLETE' || gi.order_status === 'RETURN_COMPLETE' || gi.order_status === 'EXCHANGE_COMPLETE') ? (
                                    <>
                                      <TouchableOpacity
                                        style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                        onPress={() => navigation.navigate('ShoppingReturnHistoryDetail' as never, { item: gi } as never)}
                                      >
                                        <Text style={styles.bottomBtnText}>상세 내역</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : (
                                    <></>
                                  )}
                              </View>
                            </View>
                          );
                        })}

                        {/* 그룹 하단 요약 금액 블록 (분할된 경우만) */}
                        {isSplitGroup && (
                          <View style={[commonStyle.mt10]}>
                            <View style={[layoutStyle.rowBetween, {alignItems: 'center'}]}>
                              <Text style={styles.productName}>상품금액</Text>
                              <Text style={styles.productPrice}>{group.reduce((sum: number, it: any) => {
                                const price = Number(String(it?.price ?? 0).replace(/,/g, '')) || 0;
                                const qty = Number(it?.order_quantity ?? 0) || 0;
                                return sum + price * qty;
                              }, 0).toLocaleString()}원</Text>
                            </View>
                            <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                              <Text style={styles.productName}>배송비</Text>
                              <Text style={styles.productPrice}>{first.delivery_fee?.toLocaleString()}원</Text>
                            </View>
                            {(() => {
                              const returnFeeSum = (group as any[]).reduce((sum: number, it: any) => {
                                if (String(it?.order_status) === 'RETURN_COMPLETE') {
                                  const v = Number(String(it?.total_delivery_fee_amount ?? 0).replace(/,/g, '')) || 0;
                                  return sum + v;
                                }
                                return sum;
                              }, 0);
                              return returnFeeSum > 0 ? (
                                <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                  <Text style={styles.productName}>반품 배송비</Text>
                                  <Text style={styles.productPrice}>{returnFeeSum.toLocaleString()}원</Text>
                                </View>
                              ) : null;
                            })()}
                            {(first.extra_shipping_area_cnt > 0) && (first.remote_delivery_fee > 0) && (
                              <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                <Text style={styles.productName}>도서산간 배송비</Text>
                                <Text style={styles.productPrice}>{first.remote_delivery_fee?.toLocaleString()}원</Text>
                              </View>
                            )}
                            <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                              <Text style={styles.totalPriceText}>총 결제금액</Text>
                              <Text style={styles.totalPriceText}>{(
                                Number(String((first as any)?.total_payment_amount ?? 0).replace(/,/g, '')) || 0
                              ).toLocaleString()}원</Text>
                            </View>

                          {(() => {
                            const hasRefund = (group as any[]).some((it: any) => (
                              it?.order_status === 'CANCEL_COMPLETE' || it?.order_status === 'RETURN_COMPLETE'
                            ));
                            if (!hasRefund) return null;
                            const refundSum = (group as any[]).reduce((sum: number, it: any) => {
                              if (it?.order_status === 'CANCEL_COMPLETE' || it?.order_status === 'RETURN_COMPLETE') {
                                const r = Number(String(it?.total_refund_amount ?? 0).replace(/,/g, '')) || 0;
                                return sum + r;
                              }
                              return sum;
                            }, 0);
                            return (
                              <View style={[layoutStyle.rowBetween, {alignItems: 'center'}, commonStyle.mt10]}>
                                <Text style={styles.productName}>환불 금액</Text>
                                <Text style={styles.productPrice}>{refundSum.toLocaleString()}원</Text>
                              </View>
                            );
                          })()}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}
      </View>

      {loadingMore && (displayedGroups.length < groups.length) && (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color="#40B649" />
        </View>
      )}

      <CommonPopup
        visible={popup.visible}
        message={popup.message}
        titleWeight="bold"
        backgroundColor="#FFFFFF"
        textColor="#202020"
        type={popup.type}
        onConfirm={async () => {
          if (!selectedReturnReason) {
            showWarningPopup('사유를 선택하세요.');
            return;
          }
          const maxQty = Number(pendingOrderItem?.order_quantity ?? 0);
          const qtyNum = Number(cancelQuantity);
          if (!qtyNum || qtyNum < 1 || qtyNum > maxQty) {
            showWarningPopup(`유효한 취소 수량을 입력하세요.`);
            return;
          }
          if (pendingOrderItem) {
            const extraFee = computeExtraShippingFeeForCancel(pendingOrderItem, qtyNum);
            if (extraFee > 0) {
              setPortonePaymentData({
                amount: extraFee,
                currency: 'KRW',
                merchantOrderId: `jhp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                customerName: String((memberInfo as any)?.mem_name || ''),
                customerEmail: String((memberInfo as any)?.mem_app_id || ''),
                customerPhone: String((memberInfo as any)?.mem_phone || ''),
                description: '취소에 따른 추가 배송비 결제',
              });
              setPortoneVisible(true);
              if (popup.onConfirm) {
                popup.onConfirm();
              }
              return;
            } else {
              await insertCancelApply(pendingOrderItem);
              setPendingOrderItem(null);
              if (popup.onConfirm) {
                popup.onConfirm();
              }
              await fetchOrderList();
            }
          }
        }}
        onCancel={() => { if (popup.onCancel) { popup.onCancel(); } }}
        confirmText="확인"
        cancelText="취소"
      >
        <View style={{ width: '100%', marginBottom: scale(10) }}>
          {/* 사유 선택 셀렉트 박스 */}
          <TouchableOpacity
            onPress={() => setShowReasonDropdown(!showReasonDropdown)}
            style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: scale(6),
              paddingVertical: scale(10),
              paddingHorizontal: scale(12),
              backgroundColor: '#FFFFFF',
              marginBottom: scale(8),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: '#202020', fontSize: scale(12), fontFamily: 'Pretendard-Regular' }}>
              {selectedReturnReason
                ? (returnReasons.find(r => r.value === selectedReturnReason)?.label || '사유 선택')
                : '사유를 선택하세요'}
            </Text>
            <Image source={showReasonDropdown ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} style={styles.arrowDownIcon} />
          </TouchableOpacity>
          {showReasonDropdown && (
            <View style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: scale(6),
              backgroundColor: '#FFFFFF',
              marginBottom: scale(8),
            }}>
              {returnReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  onPress={() => {
                    setSelectedReturnReason(reason.value);
                    setShowReasonDropdown(false);
                  }}
                  style={{ paddingVertical: scale(10), paddingHorizontal: scale(12) }}
                >
                  <Text style={{ color: '#202020', fontSize: scale(13), fontFamily: 'Pretendard-Regular' }}>{reason.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 상세 사유 입력 (선택사항) */}
          <TextInput
            value={returnReasonDetail}
            onChangeText={setReturnReasonDetail}
            placeholder="상세 사유를 입력하세요 (선택사항)"
            placeholderTextColor="#9E9E9E"
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: scale(6),
              paddingVertical: scale(10),
              paddingHorizontal: scale(12),
              minHeight: scale(80),
              textAlignVertical: 'top',
              backgroundColor: '#FFFFFF',
              fontSize: scale(12),
            }}
          />

          {/* 취소 수량 입력 */}
          {pendingOrderItem && (
            <View style={{ marginTop: scale(8), marginBottom: scale(14) }}>
              <Text style={{ marginBottom: scale(6), color: '#202020', fontSize: scale(12), fontFamily: 'Pretendard-Regular' }}>
                취소 수량
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#D9D9D9',
                borderRadius: scale(6),
                overflow: 'hidden',
                height: scale(36),
                backgroundColor: '#FFFFFF',
                alignSelf: 'flex-start'
              }}>
                <TouchableOpacity
                  onPress={() => {
                    const max = Number(pendingOrderItem?.order_quantity ?? 0);
                    const current = Math.min(max, Math.max(1, Number(cancelQuantity || '1')));
                    const next = Math.max(1, current - 1);
                    setCancelQuantity(String(next));
                  }}
                  style={{
                    width: scale(36), height: '100%',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <Text style={{ fontSize: scale(18), color: '#202020', fontFamily: 'Pretendard-Regular' }}>-</Text>
                </TouchableOpacity>
                <View style={{ minWidth: scale(60), paddingHorizontal: scale(12), alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: scale(14), color: '#202020', fontFamily: 'Pretendard-Regular' }}>{cancelQuantity || '1'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const max = Number(pendingOrderItem?.order_quantity ?? 0);
                    const current = Math.min(max, Math.max(1, Number(cancelQuantity || '1')));
                    const next = Math.min(max, current + 1);
                    setCancelQuantity(String(next));
                  }}
                  style={{
                    width: scale(36), height: '100%',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <Text style={{ fontSize: scale(18), color: '#202020', fontFamily: 'Pretendard-Regular' }}>+</Text>
                </TouchableOpacity>
              </View>
              {/* 무료배송 기준 하락 시 경고 문구 */}
              {(() => {
                try {
                  const qtyNum = Number(cancelQuantity);
                  if (!pendingOrderItem || !qtyNum) return null;
                  const extraFee = computeExtraShippingFeeForCancel(pendingOrderItem, qtyNum);
                  if (extraFee > 0) {
                    return (
                      <Text style={{ color: '#FF3B30', fontSize: scale(12), marginTop: scale(8), fontFamily: 'Pretendard-Regular' }}>
                        현재 상품 가격은 무료배송비용보다 적습니다. 취소를 계속 진행할 경우 배송비 추가 결제가 필요합니다.
                      </Text>
                    );
                  }
                  return null;
                } catch {
                  return null;
                }
              })()}
            </View>
          )}
        </View>
      </CommonPopup>

      {/* 문의하기 팝업 (ShoppingDetail 퍼블리싱 기반) */}
      <Modal
        visible={inquiryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <View style={styles.inquiryOverlay}>
          <View style={styles.inquiryContainer}>
            <TouchableOpacity style={styles.inquiryCloseIconBtn} onPress={() => setInquiryModalVisible(false)}>
              <Text style={styles.inquiryCloseIconText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.inquiryTitle}>이 상품에 대해{"\n"}궁금한 점이 있으신가요?</Text>
            <View style={styles.inquiryInputWrapper}>
              <TextInput
                value={inquiryText}
                onChangeText={(t) => {
                  if (t.length <= 3000) {
                    setInquiryText(t);
                    if (inquiryError && t.trim()) setInquiryError('');
                  }
                }}
                placeholder={'소중한 의견을 적어주세요.'}
                placeholderTextColor="#848484"
                multiline
                numberOfLines={4}
                style={styles.inquiryInput}
              />
              <TouchableOpacity style={styles.inquirySubmitButton} onPress={handleSubmitInquiry}>
                <Text style={styles.inquirySubmitText}>입력완료</Text>
              </TouchableOpacity>
              <View style={styles.inquiryFooterRow}>
                <Text style={styles.inquiryErrorText}>{inquiryError}</Text>
                <Text style={styles.inquiryCounter}>
                  <Text style={{ color: '#4C78ED' }}>{inquiryText.length} </Text>/ 3000
                </Text>
              </View>
            </View>
            <View>
              <Text style={styles.inquiryDesc}>
                위에 쓴 소중한 의견은 쇼핑몰 개선을 위해 사용됩니다.
                  {'\n'}{'\n'}문의를 원하시면
                  {'\n'}아래의&nbsp;
                <Text style={{ fontFamily: 'Pretendard-SemiBold' }}>
                  전화번호로 직접 문의
                </Text>
                해주세요.
              </Text>
            </View>
            {Boolean(inquiryTargetItem?.inquiry_phone_number) && (
              <View style={styles.inquiryPhoneContainer}>
                <TouchableOpacity style={styles.inquiryPhoneBtn}
                  onPress={() => {
                    const phone = String(inquiryTargetItem?.inquiry_phone_number || '');
                    if (phone) {
                      Clipboard.setString(phone);
                      setToastMessage('전화번호가 복사되었습니다.');
                      setToastVisible(true);
                    }
                  }}
                >
                  <View style={styles.inquiryClickBadge}>
                    <Text style={styles.inquiryClickText}>click</Text>
                  </View>
                  <Text style={styles.inquiryPhoneText}>{String(inquiryTargetItem?.inquiry_phone_number || '')}</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inquiryCloseContainer}>
              <TouchableOpacity onPress={() => setInquiryModalVisible(false)} style={styles.inquiryCloseBtn}>
                <Text style={styles.inquiryCloseText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <CustomToast
          visible={toastVisible}
          message={toastMessage}
          onHide={() => setToastVisible(false)}
          position="bottom"
        />
      </Modal>

      {/* 포인트 발급 안내 팝업 */}
      <CommonPopup
        visible={pointPopupVisible}
        message={`${givePoint} 포인트가 발급되었습니다~!\n마이페이지에서 확인해보세요:)`}
        titleWeight="normal"
        backgroundColor="#FFFFFF"
        textColor="#202020"
        onConfirm={() => setPointPopupVisible(false)}
        confirmText="확인"
      />

      <Modal
        visible={portoneVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => {
          setPortoneVisible(false);
          setPortonePaymentData(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <Portone
            visible={true}
            paymentData={portonePaymentData || { amount: 0, currency: 'KRW', merchantOrderId: '', customerName: '', customerEmail: '', customerPhone: '' }}
            onPaymentSuccess={async () => {
              try {
                if (pendingOrderItem) {
                  await insertCancelApply(pendingOrderItem);
                  setPendingOrderItem(null);
                  await fetchOrderList();
                }
              } finally {
                setPortoneVisible(false);
                setPortonePaymentData(null);
              }
            }}
            onPaymentFailure={() => {
              setPortoneVisible(false);
              setPortonePaymentData(null);
            }}
            onCancel={() => {
              setPortoneVisible(false);
              setPortonePaymentData(null);
            }}
          />
        </View>
      </Modal>
    </>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
  },
  searchIconContainer: {
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(14),
    gap: scale(4),
    marginRight: scale(8),
  },
  searchIcon: {
    width: scale(13),
    height: scale(13),
    resizeMode: 'contain',
  },
  searchText: {
    fontSize: scale(14),
    color: '#202020',
    fontFamily: 'Pretendard-Medium',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(14),
    flex: 1,
    marginRight: scale(8),
    gap: scale(4),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(14),
    color: '#202020',
    paddingVertical: 0,
    fontFamily: 'Pretendard-Regular',
  },
  cancelText: {
    fontSize: scale(12),
    color: '#848484',
    fontFamily: 'Pretendard-Medium',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: scale(120),
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: scale(80),
  },
  speechIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(14),
    color: '#CBCBCB',
    fontFamily: 'Pretendard-SemiBold',
    marginTop: scale(10),
  },
  orderItem: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(25),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  orderDate: {
    fontSize: scale(18),
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
  },
  orderStatusContainer: {
    backgroundColor: 'transparent',
    borderRadius: scale(5),
    paddingHorizontal: scale(5),
    paddingVertical: scale(3),
    marginLeft: scale(10),
  },
  orderStatusText: {
    fontSize: scale(10),
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },
  orderItemImgContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scale(16),
  },
  productName: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-SemiBold',
    color: '#848484',
  },
  productTitle: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
  },
  productInfo: {
    fontSize: scale(12),
    color: '#848484',
    fontFamily: 'Pretendard-Regular',
  },
  productPrice: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-SemiBold',
    color: '#848484',
  },
  totalPriceText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
  },
  bottomBtnContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: scale(10),
    borderRadius: scale(5),
    marginTop: scale(16),
  },
  bottomBtnText: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearDropdown: {
    position: 'absolute',
    top: scale(35),
    left: scale(4.5),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(5),
    maxHeight: scale(250),
    zIndex: 1000,
    overflow: 'hidden',
  },
  yearOption: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  selectedYearOption: {
    backgroundColor: '#EEEEEE',
  },
  yearOptionText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
    textAlign: 'center',
  },
  selectedYearOptionText: {
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
  },
  searchYearContainer: {
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(14),
  },
  arrowDownIcon: {
    width: scale(13),
    height: scale(13),
    resizeMode: 'contain',
  },
  loadMoreContainer: {
    paddingVertical: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  inquiryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inquiryContainer: {
    width: '90%',
    borderRadius: scale(12),
    backgroundColor: '#FFFFFF',
    padding: scale(16),
  },
  inquiryCloseIconBtn: {
    position: 'absolute',
    right: scale(10),
    top: scale(10),
    padding: scale(6),
    zIndex: 1,
  },
  inquiryCloseIconText: {
    color: '#202020',
    fontSize: scale(20),
    fontFamily: 'Pretendard-SemiBold',
  },
  inquiryTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
    textAlign: 'center',
  },
  inquiryInputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inquiryInput: {
    height: scale(130),
    borderWidth: 1,
    borderColor: '#202020',
    borderRadius: scale(10),
    padding: scale(16),
    marginTop: scale(16),
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    fontSize: scale(12),
  },
  inquirySubmitButton: {
    position: 'absolute',
    bottom: scale(30),
    left: '50%',
    transform: [{ translateX: -scale(30) }],
    backgroundColor: '#000000',
    padding: scale(8),
    borderRadius: scale(10),
  },
  inquirySubmitText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontFamily: 'Pretendard-SemiBold',
  },
  inquiryCounter: {
    fontSize: scale(12),
    color: '#717171',
    fontFamily: 'Pretendard-Regular',
  },
  inquiryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(6),
  },
  inquiryErrorText: {
    color: '#F04D4D',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  inquiryDesc: {
    fontSize: scale(14),
    color: '#202020',
    marginTop: scale(30),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  inquiryPhoneContainer: {
    marginTop: scale(20),
    alignItems: 'center',
  },
  inquiryPhoneBtn: {
    backgroundColor: '#202020',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inquiryClickBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    paddingVertical: scale(1),
    width: scale(38),
    marginBottom: scale(5),
  },
  inquiryClickText: {
    fontSize: scale(12),
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  inquiryPhoneText: {
    fontSize: scale(12),
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Regular',
  },
  inquiryCloseContainer: {
    marginTop: scale(16),
  },
  inquiryCloseBtn: {
    alignSelf: 'center',
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
  },
  inquiryCloseText: {
    color: '#848484',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
});

export default ShoppingOrderHistory;
