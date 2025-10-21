import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { getMemberReturnAppDetail, type GetReturnsResponse, type Return } from '../api/services/memberReturnAppService';
import { getCommonCodeList } from '../api/services/commonCodeService';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';


const ShoppingReturnHistoryDetail = ({route}: any) => {
  const { item } = route.params;
  const navigation = useNavigation();
  const [orderStatusTypes, setOrderStatusTypes] = useState<Array<{label: string, value: string}>>([]);
  const [returnReasons, setReturnReasons] = useState<Array<{label: string, value: string}>>([]);
  const [returnDetail, setReturnDetail] = useState<any>(null);
  const [loadingReturnDetail, setLoadingReturnDetail] = useState(false);

  const fetchReturnDetail = async () => {
    try {
      if (!item.return_app_id) {
        return;
      }
      setLoadingReturnDetail(true);
      const params: any = {
        return_app_id: Number(item.return_app_id),
      };
      
      const res: GetReturnsResponse = await getMemberReturnAppDetail(params);

      if (res?.success) {
        setReturnDetail(res.data);
      } else {
        setReturnDetail([]);
      }
    } catch (e) {
      setReturnDetail([]);
    } finally {
      setLoadingReturnDetail(false);
    }
  };

  const loadOrderStatusTypes = async () => {
    try {
      const res = await getCommonCodeList({ group_code: 'ORDER_STATUS_TYPE' });
      const res2 = await getCommonCodeList({ group_code: 'RETURN_REASON_TYPE' });
      if (res?.success && res.data) {
        const types = res.data.map((item: any) => ({
          label: item.common_code_name,
          value: item.common_code,
        }));
        setOrderStatusTypes(types);
        setReturnReasons(res2.data.map((item: any) => ({
          label: item.common_code_name,
          value: item.common_code,
        })));
      } else {
        setOrderStatusTypes([]);
        setReturnReasons([]);
      }
    } catch (e) {
      setOrderStatusTypes([]);
      setReturnReasons([]);
    }
  };

  useEffect(() => {
    loadOrderStatusTypes();
    fetchReturnDetail();
  }, []);
  
  return (
    <>
      <CommonHeader 
        title="취소•반품•교환 내역"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        titleWidth="38%"
      />
      <View style={styles.container}>
        {loadingReturnDetail ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#42B649" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            // bounces={false}
            alwaysBounceVertical={false}
            contentContainerStyle={{paddingBottom: scale(20)}}
          >
            <View style={[styles.topContainer, {marginBottom: returnDetail?.order_status === 'CANCEL_COMPLETE' ? scale(20) : 0}]}>
              <Text style={styles.date}>{orderStatusTypes.find(t => t.value === returnDetail?.order_status)?.value === 'RETURN_COMPLETE' ? '반품일' : orderStatusTypes.find(t => t.value === returnDetail?.order_status)?.value === 'CANCEL_COMPLETE' ? '취소일' : '교환일'} {returnDetail?.reg_dt}</Text>
              <TouchableOpacity
                style={[layoutStyle.rowStart]}
                onPress={() => {
                  const productData = {
                    product_app_id: returnDetail?.product_app_id,
                    product_detail_app_id: returnDetail?.product_detail_app_id,
                  };
                  navigation.navigate('ShoppingDetail', { productParams: productData } as never);
              }}>
                <View style={styles.imgContainer}>
                  <ShoppingThumbnailImg
                    productAppId={returnDetail?.product_app_id}
                    width={scale(80)}
                    height={scale(80)}
                  />
                </View>
                <View style={[commonStyle.ml10]}>
                  <Text style={styles.brandName}>{returnDetail?.brand_name}</Text>
                  <Text style={styles.productName}>{returnDetail?.product_name}</Text>
                  <Text style={styles.productOptionName}>
                    {returnDetail?.option_amount ? returnDetail?.option_amount + returnDetail?.option_unit + ' / ' : ''}{returnDetail?.quantity}개
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {(returnDetail?.order_status === 'RETURN_COMPLETE' || returnDetail?.order_status === 'EXCHANGE_COMPLETE') && (
              <View style={[commonStyle.mt20, styles.borderThickTop]}>
                <Text style={styles.contentTitle}>{returnDetail?.order_status === 'RETURN_COMPLETE' ? '반품' : '교환'} 수거 주소</Text>
                <View style={[styles.borderTop, layoutStyle.rowStart, layoutStyle.alignStart, commonStyle.pt15]}>
                  <Text style={[styles.contentLabel, {width: scale(95)}]}>수거방법</Text>
                  <Text style={styles.contentDesc}>자동 수거</Text>
                </View>
                <View style={[layoutStyle.rowStart, layoutStyle.alignStart, commonStyle.mt5]}>
                  <Text style={[styles.contentLabel, {width: scale(95)}]}>수거지</Text>
                  <Text style={styles.contentDesc}>[{returnDetail?.zip_code}] {returnDetail?.address} {'\n'}{returnDetail?.address_detail}</Text>
                </View>
                <View style={[layoutStyle.rowStart, layoutStyle.alignStart, commonStyle.mt5]}>
                  <Text style={[styles.contentLabel, {width: scale(95)}]}>수령자명</Text>
                  <Text style={styles.contentDesc}>{returnDetail?.receiver_name}</Text>
                </View>
                <View style={[layoutStyle.rowStart, layoutStyle.alignStart, commonStyle.mt5]}>
                  <Text style={[styles.contentLabel, {width: scale(95)}]}>수령자 전화번호</Text>
                  <Text style={styles.contentDesc}>{returnDetail?.receiver_phone}</Text>
                </View>
                <View style={[layoutStyle.rowStart, layoutStyle.alignStart, commonStyle.mt5, commonStyle.pb15]}>
                  <Text style={[styles.contentLabel, {width: scale(95)}]}>요청사항</Text>
                  <Text style={[styles.contentDesc, { color: returnDetail?.delivery_request ? '#202020' : '#848484' }]}>{returnDetail?.delivery_request ? returnDetail?.delivery_request : '없음'}</Text>
                </View>
              </View>
            )}
            
            <View style={[styles.borderThickTop]}>
              <Text style={styles.contentTitle}>사유 정보</Text>
              <View style={[layoutStyle.rowStart, layoutStyle.alignStart, styles.borderTop, commonStyle.pt15]}>
                <Text style={[styles.contentLabel, {width: scale(95)}]}>기본 사유</Text>
                <Text style={[styles.contentDesc]}>{returnReasons.find(t => t.value === returnDetail?.return_reason_type)?.label}</Text>
              </View>
              <View style={[layoutStyle.rowStart, layoutStyle.alignStart, commonStyle.mt5, commonStyle.pb15]}>
                <Text style={[styles.contentLabel, {width: scale(95)}]}>상세 사유</Text>
                <Text style={styles.contentDesc}>{returnDetail?.reason ? returnDetail?.reason : '-'}</Text>
              </View>
            </View>

            <View style={[styles.borderThickTop]}>
              <Text style={styles.contentTitle}>환불 안내</Text>
              <View style={[layoutStyle.rowBetween, commonStyle.pt15, styles.borderTop]}>
                <Text style={styles.contentLabel}>상품금액</Text>
                <Text style={styles.refundDesc}>{(returnDetail?.price * returnDetail?.order_quantity)?.toLocaleString()}원</Text>
              </View>
              {returnDetail?.point_use_amount > 0 && (
                <View style={[layoutStyle.rowBetween, commonStyle.pt15, styles.borderTop, commonStyle.mt15]}>
                  <Text style={styles.contentLabel}>포인트 환불</Text>
                  <Text style={styles.refundDesc}>{Number(returnDetail?.point_use_amount)?.toLocaleString()+'원'}</Text>
                </View>
              )}
              {returnDetail?.coupon_discount_amount > 0 && (
                <View style={[layoutStyle.rowBetween, commonStyle.pt15, styles.borderBottom, commonStyle.pb15]}>
                  <Text style={styles.contentLabel}>쿠폰 환불</Text>
                  <Text style={styles.refundDesc}>{Number(returnDetail?.coupon_discount_amount)?.toLocaleString()}{returnDetail?.coupon_discount_type === 'PERCENT' ? '%' : '원'}</Text>
                </View>
              )}
              <View style={[layoutStyle.rowBetween, commonStyle.pt15]}>
                <Text style={styles.contentLabel}>상품 결제금액</Text>
                <Text style={styles.refundDesc}>{returnDetail?.payment_amount?.toLocaleString()}원</Text>
              </View>
              <View style={[layoutStyle.rowBetween, commonStyle.pt15]}>
                <Text style={styles.contentLabel}>상품 환불금액</Text>
                <Text style={styles.refundDesc}>{Number(returnDetail?.refund_amount)?.toLocaleString()}원</Text>
              </View>
              {(returnDetail?.return_delivery_fee) && ((returnDetail?.order_status === 'RETURN_COMPLETE') || (returnDetail?.order_status === 'EXCHANGE_COMPLETE')) && (
                <View style={[layoutStyle.rowBetween, commonStyle.pt15]}>
                  <View style={[{position: 'relative'}]}>
                    <Text style={styles.contentLabel}>반품 배송비</Text>
                    <Text style={[styles.absolute, styles.contentDesc, {fontSize: scale(10), color: '#B8B8B8'}]}>{returnDetail?.is_admin_fault === 'Y' ? '판매자 귀책' : '구매자 귀책'}</Text>
                  </View>
                  <Text style={styles.refundDesc}>{(returnDetail?.return_delivery_fee && (returnDetail?.return_delivery_fee - (returnDetail?.extra_shipping_area_cnt > 0 ? returnDetail?.remote_delivery_fee : 0))?.toLocaleString()+'원')}</Text>
                </View>
              )}
              {((returnDetail?.extra_shipping_area_cnt > 0 && returnDetail?.remote_delivery_fee) && ((returnDetail?.order_status === 'RETURN_COMPLETE') || (returnDetail?.order_status === 'EXCHANGE_COMPLETE'))) && (
                <View style={[layoutStyle.rowBetween, commonStyle.pt15]}>
                  <View style={[{position: 'relative'}]}>
                    <Text style={styles.contentLabel}>도서산간 배송비</Text>
                    <Text style={[styles.absolute, styles.contentDesc, {fontSize: scale(10), color: '#B8B8B8', left: scale(78)}]}>{returnDetail?.return_delivery_fee > 0 ? '판매자 귀책' : '구매자 귀책'}</Text>
                  </View>
                  <Text style={styles.refundDesc}>{(returnDetail?.extra_shipping_area_cnt > 0 && returnDetail?.remote_delivery_fee?.toLocaleString()+'원')}</Text>
                </View>
              )}
              <View style={[layoutStyle.rowBetween, styles.borderBlackTop, commonStyle.pt10, commonStyle.mt10]}>
                <Text style={[styles.contentLabel, {fontFamily: 'Pretendard-SemiBold', fontSize: scale(14), color: '#202020'}]}>총 환불 금액</Text>
                <Text style={[styles.refundDesc, {fontFamily: 'Pretendard-SemiBold', fontSize: scale(14), color: '#202020'}]}>{Number(returnDetail?.total_refund_amount)?.toLocaleString()+'원'}</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
  },
  scrollContainer: {
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  date: {
    fontSize: scale(14),
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: scale(5),
  },
  topContainer: {
    backgroundColor: '#F6F6F6',
    padding: scale(10),
    borderRadius: scale(10),
  },
  imgContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  brandName: {
    fontSize: scale(14),
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
  },
  productName: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
    marginTop: scale(3),
    marginBottom: scale(3),
  },
  productOptionName: {
    fontSize: scale(12),
    color: '#848484',
    fontFamily: 'Pretendard-Regular',
  },
  contentTitle: {
    fontSize: scale(14),
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
    paddingVertical: scale(10),
  },
  contentLabel: {
    fontSize: scale(12),
    color: '#848484',
    fontFamily: 'Pretendard-Medium',
  },
  contentDesc: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-Medium',
    flex: 1,
    flexWrap: 'wrap',
  },
  refundDesc: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-Medium',
  },
  borderThickTop: {
    borderTopWidth: 5,
    borderColor: '#EEEEEE',
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  borderTop: {
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  borderBlackTop: {
    borderTopWidth: 1,
    borderColor: '#202020',
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: scale(100),
  },
  absolute: {
    position: 'absolute',
    left: scale(58),
    bottom: scale(6),
  },
});

export default ShoppingReturnHistoryDetail;
