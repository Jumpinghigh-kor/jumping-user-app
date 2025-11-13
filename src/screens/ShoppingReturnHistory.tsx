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
import { getMemberReturnAppList, type GetReturnsResponse, type Return } from '../api/services/memberReturnAppService';
import { getCommonCodeList } from '../api/services/commonCodeService';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';


const ShoppingReturnHistory = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('all');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [returnList, setReturnList] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [orderStatusTypes, setOrderStatusTypes] = useState<Array<{label: string, value: string}>>([]);
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    ...Array.from({ length: 5 }, (_, i) => ({ value: (currentYear - i).toString(), label: `${currentYear - i}년` }))
  ];
  
  const fetchReturnList = async () => {
    try {
      if (!memberInfo?.mem_id) {
        return;
      }
      setLoadingReturns(true);
      const params: any = {
        mem_id: Number(memberInfo?.mem_id),
        order_detail_app_id: null,
        type: activeTab,
        year: selectedYear,
      };
      
      if (searchQuery && searchQuery.trim() !== '') {
        params.search_content = searchQuery.trim();
      }
      if (selectedYear) {
        params.year = selectedYear.toString();
      }
      const res: GetReturnsResponse = await getMemberReturnAppList(params);

      if (res?.success) {
        setReturnList(res.data);
      } else {
        setReturnList([]);
      }
    } catch (e) {
      setReturnList([]);
    } finally {
      setLoadingReturns(false);
    }
  };

  const loadOrderStatusTypes = async () => {
    try {
      const res = await getCommonCodeList({ group_code: 'ORDER_STATUS_TYPE' });
      if (res?.success && res.data) {
        const types = res.data.map((item: any) => ({
          label: item.common_code_name,
          value: item.common_code,
        }));
        setOrderStatusTypes(types);
      } else {
        setOrderStatusTypes([]);
      }
    } catch (e) {
      setOrderStatusTypes([]);
    }
  };

  useEffect(() => {
    loadOrderStatusTypes();
  }, []);

  useEffect(() => {
    fetchReturnList();
  }, [activeTab]);

  useEffect(() => {
    if (isSearching && searchQuery.trim() === '') {
      setReturnList([]);
      return;
    }
    if (activeTab !== 'all') {
      setActiveTab('all');
      return;
    }
    fetchReturnList();
  }, [searchQuery, isSearching, selectedYear]);

  return (
    <>
      <CommonHeader 
        title="취소•반품•교환 내역"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        titleWidth="39%"
      />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          {!isSearching ? (
            <View style={[layoutStyle.rowStart, {alignItems: 'center'}]}>
              <TouchableOpacity style={[layoutStyle.rowCenter, styles.searchBox]} onPress={() => setIsSearching(true)}>
                <Image source={IMAGES.icons.searchStrokeBlack} style={styles.searchIcon} />
                <Text style={[styles.searchText, commonStyle.ml5]}>검색</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[layoutStyle.rowCenter, styles.searchBox, activeTab === 'all' && styles.activeTab]} onPress={() => setActiveTab('all')}>
                <Text style={[styles.searchText, activeTab === 'all' && styles.activeTabText]}>전체</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[layoutStyle.rowCenter, styles.searchBox, activeTab === 'cancel' && styles.activeTab]} onPress={() => setActiveTab('cancel')}>
                <Text style={[styles.searchText, activeTab === 'cancel' && styles.activeTabText]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[layoutStyle.rowCenter, styles.searchBox, activeTab === 'return' && styles.activeTab]} onPress={() => setActiveTab('return')}>
                <Text style={[styles.searchText, activeTab === 'return' && styles.activeTabText]}>반품</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[layoutStyle.rowCenter, styles.searchBox, activeTab === 'exchange' && styles.activeTab]} onPress={() => setActiveTab('exchange')}>
                <Text style={[styles.searchText, activeTab === 'exchange' && styles.activeTabText]}>교환</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[layoutStyle.rowStart, {alignItems: 'center'}]}>
              <View style={styles.searchInputContainer}>
                <Image source={IMAGES.icons.searchStrokeBlack} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="상품이름을 입력하세요"
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) {
                      setIsSearching(false);
                    }
                  }}
                />
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowYearDropdown(false); setSearchQuery(''); setIsSearching(false); }}>
                  <Text style={styles.searchText}>취소</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.yearContainer}>
                <TouchableOpacity 
                  style={styles.searchYearContainer}
                  onPress={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <Text>{`${selectedYear}년`}</Text>
                </TouchableOpacity>
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
          )}
        </View>

        {loadingReturns ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#42B649" />
          </View>
        ) : !returnList.length ? (
          <View style={styles.emptyContainer}>
            <Image source={IMAGES.icons.orderGray} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>취소•반품•교환 내역이 없어요</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
          >
            <View>
              {returnList.map((item, index) => (
                <View key={index} style={styles.returnHistoryItem}>
                  <View>
                    <Text style={styles.date}>{item.reg_dt}</Text>
                  </View>
                  <TouchableOpacity
                    style={[layoutStyle.rowStart, {alignItems: 'center'}]}
                    onPress={() => {
                      navigation.navigate('ShoppingDetail' as never, {
                        productParams: item,
                      });
                    }}
                  >
                    <View style={styles.imgContainer}>
                      <ShoppingThumbnailImg
                        productAppId={item.product_app_id}
                        width={scale(80)}
                        height={scale(80)}
                      />
                    </View>
                    <View style={[commonStyle.ml10]}>
                      <View style={[styles.returnStatusContainer, { backgroundColor: item.order_status === 'CANCEL_COMPLETE' ? '#BDBDBD' : item.order_status === 'EXCHANGE_COMPLETE' ? '#3899F4' : '#42B649' }]}>
                        <Text style={styles.returnStatus}>{orderStatusTypes.find(t => t.value === item.order_status)?.label}</Text>
                      </View>
                      <View style={[layoutStyle.rowStart, {alignItems: 'center'}]}>
                        <Text style={styles.brandName}>{item.brand_name}</Text>
                      </View>                      
                      <Text style={[styles.productName]}>{item.product_name}</Text>
                      <Text style={[styles.productOptionName]}>{item?.option_amount ? item?.option_amount + item?.option_unit + ' / ' : ''}{item?.quantity}개</Text>
                    </View>
                  </TouchableOpacity>
                  <View>
                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => {
                        navigation.navigate('ShoppingReturnHistoryDetail' as never, {
                          item: item,
                        });
                      }}
                    >
                      <Text style={styles.detailBtnText}>상세 보기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
  },
  searchContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
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
  },
  searchInput: {
    flex: 1,
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
    paddingVertical: 0,
    marginLeft: scale(6),
  },
  searchIcon: {
    width: scale(10),
    height: scale(10),
    resizeMode: 'contain',
  },
  searchBox: {
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    marginRight: scale(8),
  },
  searchText: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
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
    marginLeft: scale(8),
  },
  listContainer: {
  },
  activeTab: {
    backgroundColor: '#42B649',
    borderWidth: 1,
    borderColor: '#42B649',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  returnHistoryItem: {
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  date: {
    fontSize: scale(16),
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: scale(6),
  },
  returnHistoryItemText: {
    fontSize: scale(14),
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
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
  returnStatusContainer: {
    borderRadius: scale(5),
    paddingVertical: scale(3),
    paddingHorizontal: scale(5),
    alignSelf: 'flex-start',
    marginBottom: scale(2),
  },
  returnStatus: {
    fontSize: scale(10),
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },
  productName: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
  },
  productOptionName: {
    fontSize: scale(12),
    color: '#848484',
    fontFamily: 'Pretendard-Regular',
  },
  detailBtn: {
    backgroundColor: '#42B649',
    borderRadius: scale(5),
    paddingVertical: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(10),
  },
  detailBtnText: {
    fontSize: scale(14),
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyContainer: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#CBCBCB',
    fontFamily: 'Pretendard-SemiBold',
    marginTop: scale(10),
  },
});

export default ShoppingReturnHistory;
