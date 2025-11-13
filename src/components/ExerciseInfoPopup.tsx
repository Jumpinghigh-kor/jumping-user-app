import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {scale} from '../utils/responsive';
import {useAuth} from '../hooks/useAuth';
import {insertMemberExerciseApp, getMemberExerciseAppInfo, updateMemberExerciseApp } from '../api/services/memberExerciseAppService';
import {getCommonCodeList, CommonCode} from '../api/services/commonCodeService';
import CommonPopup from './CommonPopup';

interface ExerciseInfoPopupProps {
  visible: boolean;
  date?: string;
  onClose: () => void;
  onExerciseInfoUpdated?: () => void;
}

type ErrorMessage = {
  msg: string;
  type: string;
};

// 셀렉트 박스 옵션 컴포넌트
const SelectOption = ({
  value,
  selected,
  onSelect,
}: {
  value: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <TouchableOpacity
    style={[styles.selectOption, selected && styles.selectedOption]}
    onPress={onSelect}>
    <Text
      style={[styles.selectOptionText, selected && styles.selectedOptionText]}>
      {value}
    </Text>
  </TouchableOpacity>
);

// 시간 선택 컴포넌트
const TimeSelector = ({
  hours,
  minutes,
  setHours,
  setMinutes,
  showHoursSelect,
  showMinutesSelect,
  setShowHoursSelect,
  setShowMinutesSelect,
  hoursOptions,
  minutesOptions,
  disabled = false
}: {
  hours: string;
  minutes: string;
  setHours: (value: string) => void;
  setMinutes: (value: string) => void;
  showHoursSelect: boolean;
  showMinutesSelect: boolean;
  setShowHoursSelect: (value: boolean) => void;
  setShowMinutesSelect: (value: boolean) => void;
  hoursOptions: string[];
  minutesOptions: string[];
  disabled?: boolean;
}) => {
  return (
    <View style={styles.timeInputRow}>
      {/* 시간 선택 */}
      <View style={styles.timeItem}>
        <View style={styles.selectContainer}>
          <TouchableOpacity
            style={[styles.selectButton, disabled && styles.disabledButton]}
            onPress={() => {
              if (disabled) return;
              setShowHoursSelect(!showHoursSelect);
              setShowMinutesSelect(false);
            }}>
            <Text style={styles.selectTimeText}>
              {hours}
            </Text>
          </TouchableOpacity>

          {showHoursSelect && (
            <View style={styles.selectOptionsContainer}>
              <ScrollView style={styles.selectOptionsScroll} nestedScrollEnabled={true}>
                {hoursOptions.map(hour => (
                  <SelectOption
                    key={`hour-${hour}`}
                    value={hour}
                    selected={hour === hours}
                    onSelect={() => {
                      setHours(hour);
                      setShowHoursSelect(false);
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <Text style={styles.timeUnitText}>시간</Text>
      </View>

      {/* 분 선택 */}
      <View style={styles.timeItem}>
        <View style={styles.selectContainer}>
          <TouchableOpacity
            style={[styles.selectButton, disabled && styles.disabledButton]}
            onPress={() => {
              if (disabled) return;
              setShowMinutesSelect(!showMinutesSelect);
              setShowHoursSelect(false);
            }}>
            <Text style={styles.selectTimeText}>
              {minutes}
            </Text>
          </TouchableOpacity>

          {showMinutesSelect && (
            <View style={styles.selectOptionsContainer}>
              <ScrollView style={styles.selectOptionsScroll} nestedScrollEnabled={true}>
                {minutesOptions.map(minute => (
                  <SelectOption
                    key={`minute-${minute}`}
                    value={minute}
                    selected={minute === minutes}
                    onSelect={() => {
                      setMinutes(minute);
                      setShowMinutesSelect(false);
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <Text style={styles.timeUnitText}>분</Text>
      </View>
    </View>
  );
};

// 소모 칼로리 입력 컴포넌트
const CaloryInput = ({
  value,
  setValue,
  disabled = false
}: {
  value: string;
  setValue: (value: string) => void;
  disabled?: boolean;
}) => {
  return (
    <View style={styles.heartRateContainer}>
      <View style={styles.burnCaloriesInputContainer}>
        <TextInput
          style={[
            styles.burnCaloriesInput,
            disabled && {color: '#999999'}
          ]}
          value={value}
          onChangeText={(text) => {
            // 숫자만 허용
            const numericValue = text.replace(/[^0-9]/g, '');
            // 첫 입력 시 초기값 0 지우기
            if (value === '0' && numericValue !== '') {
              setValue(numericValue.substring(numericValue.indexOf('0') + 1));
            } else {
              setValue(numericValue);
            }
          }}
          placeholder="0"
          placeholderTextColor="#999999"
          keyboardType="numeric"
          maxLength={4}
          editable={!disabled}
        />
        <Text style={styles.burnCaloriesText}>Kcal</Text>
      </View>
    </View>
  );
};

// 선택 버튼 컴포넌트
const SelectButtons = ({
  options,
  selectedValue,
  setSelectedValue,
  buttonContainerStyle,
  buttonStyle,
  middleItemHasMargin = false,
  onDeselect = () => {},
}: {
  options: string[];
  selectedValue: string;
  setSelectedValue: (value: string) => void;
  buttonContainerStyle?: Object;
  buttonStyle?: Object;
  middleItemHasMargin?: boolean;
  onDeselect?: () => void;
}) => {
  return (
    <View style={buttonContainerStyle}>
      {options.map((option, index) => {
        const isMiddleItem = index === 1 || index === 4 && middleItemHasMargin;
        const isSelected = selectedValue === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              buttonStyle,
              isSelected && styles.selectedButton,
              isMiddleItem && { marginHorizontal: scale(10) },
            ]}
            onPress={() => {
              if (isSelected) {
                setSelectedValue('');
                onDeselect();
              } else {
                setSelectedValue(option);
              }
            }}
          >
            <Text
              style={[
                styles.selectButtonText,
                isSelected && styles.selectedText,
              ]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ExerciseInfoPopup: React.FC<ExerciseInfoPopupProps> = ({
  visible,
  date,
  onClose,
  onExerciseInfoUpdated
}) => {
  const {memberInfo} = useAuth();
  const [formData, setFormData] = useState({
    jumping: {
      intensityLevel: '',
      exerciseHours: '00',
      exerciseMinutes: '00',
      heartRate: '0',
      isHeartRateSkipped: false
    },
    other: {
      exerciseType: '',
      exerciseHours: '00',
      exerciseMinutes: '00',
      exerciseCalory: '0'
    }
  });
  const [showJumpingHoursSelect, setShowJumpingHoursSelect] = useState(false);
  const [showJumpingMinutesSelect, setShowJumpingMinutesSelect] = useState(false);
  const [showOtherHoursSelect, setShowOtherHoursSelect] = useState(false);
  const [showOtherMinutesSelect, setShowOtherMinutesSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [errMsg, setErrMsg] = useState<ErrorMessage>({ msg: '', type: '' });
  const [commonPopup, setCommonPopup] = useState({
    visible: false,
    message: '',
    type: 'default' as 'default' | 'warning' | 'confirm',
  });
  const [exerciseTypes, setExerciseTypes] = useState<CommonCode[]>([]);

  const updateFormData = (section: 'jumping' | 'other', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // 강도 레벨 매핑
  const getIntensityLevelValue = (level: string): string | null => {
    switch (level) {
      case '저강도':
        return 'LOW';
      case '중강도':
        return 'MODERATE';
      case '고강도':
        return 'HIGH';
      default:
        return null;
    }
  };

  // 강도 레벨별 평균 심박수 매핑
  const getAverageHeartRate = (intensityLevel: string): string => {
    switch (intensityLevel) {
      case '저강도':
        return '110';
      case '중강도':
        return '130';
      case '고강도':
        return '150';
      default:
        return '0';
    }
  };

  // 운동 종목 조회
  const fetchExercisType = async () => {
    try {
      const response = await getCommonCodeList({ group_code: 'EXERCISE_TYPE' });
      if (response.success && response.data) {
        setExerciseTypes(response.data);
      }
    } catch (error) {
    }
  };

  const getOtherExerciseTypeValue = (type: string): string => {
    const exerciseType = exerciseTypes.find(item => item.common_code_name === type);
    return exerciseType ? exerciseType.common_code : 'ETC';
  };

  // 시간 포맷팅 (한 자리 수일 경우 앞에 0 추가)
  const formatTimeValue = (value: string): string => {
    return value.padStart(2, '0');
  };

  // 날짜 포맷팅 함수
  const formatDate = (date: string) => {
    // YYYYMMDD 형식인 경우 그대로 반환
    if (date.length === 8) {
      return date;
    }
    // 일(DD)만 있는 경우 현재 년월 사용
    else {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const selectedDate = date.padStart(2, '0');
      return `${year}${month}${selectedDate}`;
    }
  };

  // 운동 정보 초기화 함수
  const resetExerciseData = () => {
    setFormData({
      jumping: {
        intensityLevel: '',
        exerciseHours: '00',
        exerciseMinutes: '00',
        heartRate: '',
        isHeartRateSkipped: false
      },
      other: {
        exerciseType: '',
        exerciseHours: '00',
        exerciseMinutes: '00',
        exerciseCalory: ''
      }
    });
    setExerciseId(null);
  };

  // 운동 정보 조회
  const fetchExerciseData = async () => {
    if (!memberInfo?.mem_id || !date) return;

    try {
      const formattedDate = formatDate(date);
      const memId = typeof memberInfo.mem_id === 'string' ? parseInt(memberInfo.mem_id, 10) : memberInfo.mem_id;
      const response = await getMemberExerciseAppInfo(memId, formattedDate);

      if (response.success && response.data && (Array.isArray(response.data) ? response.data.length > 0 : true)) {
        const exerciseData = Array.isArray(response.data) 
          ? response.data[0] 
          : response.data;
        
        if (exerciseData) {
          if (exerciseData.exercise_app_id) {
            setExerciseId(exerciseData.exercise_app_id);
          }
          
          const intensityMap: { [key: string]: string } = {
            'LOW': '저강도',
            'MODERATE': '중강도',
            'HIGH': '고강도'
          };

          // 기타 운동 데이터 매핑
          const otherExerciseTypeMap: { [key: string]: string } = {
            'RUNNING': '러닝',
            'SPINNING': '스피닝',
            'SWIMMING': '수영',
            'CYCLING': '사이클',
            'CLIMBING': '등산',
            'ETC': '기타'
          };

          // 점핑 운동 데이터 매핑
          let jumpingData = {
            intensityLevel: '',
            exerciseHours: '00',
            exerciseMinutes: '00',
            heartRate: '0',
            isHeartRateSkipped: false
          };

          if (exerciseData.jumping_exercise_time) {
            const hours = exerciseData.jumping_exercise_time.substring(0, 2);
            const minutes = exerciseData.jumping_exercise_time.substring(2, 4);
            
            jumpingData = {
              intensityLevel: intensityMap[exerciseData.jumping_intensity_level] || '',
              exerciseHours: hours,
              exerciseMinutes: minutes,
              heartRate: exerciseData.jumping_heart_rate ? exerciseData.jumping_heart_rate.toString() : '0',
              isHeartRateSkipped: !exerciseData.jumping_heart_rate
            };
          }

          // 기타 운동 데이터 매핑
          let otherData = {
            exerciseType: '',
            exerciseHours: '00',
            exerciseMinutes: '00',
            exerciseCalory: '0'
          };

          if (exerciseData.other_exercise_type) {
            otherData = {
              exerciseType: otherExerciseTypeMap[exerciseData.other_exercise_type] || '',
              exerciseHours: exerciseData.other_exercise_time ? exerciseData.other_exercise_time.substring(0, 2) : '00',
              exerciseMinutes: exerciseData.other_exercise_time ? exerciseData.other_exercise_time.substring(2, 4) : '00',
              exerciseCalory: exerciseData.other_exercise_calory ? exerciseData.other_exercise_calory.toString() : '0'
            };
          }

          setFormData(prev => ({
            ...prev,
            jumping: jumpingData,
            other: otherData
          }));
        } else {
          resetExerciseData();
        }
      } else {
        resetExerciseData();
      }
    } catch (error) {
      resetExerciseData();
    }
  };

  const handleSave = async () => {
    // 유효성 검사 최적화
    const { jumping, other } = formData;

    if (!other.exerciseType && !jumping.intensityLevel) {
      setErrMsg({ msg: '점핑 피트니스 또는 기타 운동을 선택해주세요', type: 'exerciseType' });
      return;
    }

    if (jumping.intensityLevel && jumping.exerciseHours === '00' && jumping.exerciseMinutes === '00') {
      setErrMsg({ msg: '점핑 운동 시간을 입력해주세요', type: 'jumpingExerciseHours' });
      return;
    }

    if (other.exerciseType) {
      if (other.exerciseHours === '00' && other.exerciseMinutes === '00') {
        setErrMsg({ msg: '기타 운동 시간을 입력해주세요', type: 'otherExerciseHours' });
        return;
      }
      const calStr = (other.exerciseCalory || '').trim();
      const calNum = Number(calStr);
      if (!calStr || !Number.isFinite(calNum) || calNum <= 0) {
        setErrMsg({ msg: '소모 칼로리를 입력해주세요', type: 'otherExerciseCalory' });
        return;
      }
    }

    try {
      setIsLoading(true);

      const exerciseTime = `${formatTimeValue(jumping.exerciseHours)}${formatTimeValue(jumping.exerciseMinutes)}`;

      // 심박수 값 처리 최적화
      const heartRateValue = (jumping.isHeartRateSkipped || jumping.heartRate === '0' || jumping.heartRate === '') 
        ? getAverageHeartRate(jumping.intensityLevel)
        : jumping.heartRate;

      const formattedDate = formatDate(date || new Date().getDate().toString());
      
      // 공통 운동 데이터 생성
      const otherExerciseTime = other.exerciseType ? 
        `${formatTimeValue(other.exerciseHours)}${formatTimeValue(other.exerciseMinutes)}` : null;
      
      const commonExerciseData = {
        mem_id: Number(memberInfo.mem_id),
        exercise_dt: formattedDate,
        jumping_exercise_time: jumping.intensityLevel ? exerciseTime : null,
        jumping_intensity_level: getIntensityLevelValue(jumping.intensityLevel),
        jumping_heart_rate: jumping.intensityLevel ? heartRateValue : null,
        other_exercise_type: other.exerciseType ? getOtherExerciseTypeValue(other.exerciseType) : null,
        other_exercise_time: otherExerciseTime,
        other_exercise_calory: other.exerciseType ? Number(other.exerciseCalory) : null,
      };
      
      let response;

      if (exerciseId) {
        response = await updateMemberExerciseApp({
          exercise_app_id: exerciseId,
          ...commonExerciseData,
        });
      } else {
        response = await insertMemberExerciseApp({
          ...commonExerciseData,
          reg_dt: formattedDate.substring(0, 6),
          reg_id: Number(memberInfo.mem_id),
          mod_dt: null,
          mod_id: null
        });
      }

      setIsLoading(false);
      
      if (response.success) {
        showPopup('success', '운동 정보가 저장되었습니다');
        if (onExerciseInfoUpdated) {
          onExerciseInfoUpdated();
        }
        onClose();
      } else {
        showPopup('error', response.message || '운동 정보 저장에 실패했습니다');
      }
    } catch (error) {
      setIsLoading(false);
      showPopup('error', '운동 정보 저장 중 오류가 발생했습니다');
    }
  };

  // visible이 true일 때 데이터 조회
  useEffect(() => {
    if (visible) {
      fetchExerciseData();  
      fetchExercisType();
    }
  }, [visible, date]);

  // 시간 변경 시 에러 메시지 초기화
  useEffect(() => {
    if (formData.jumping.exerciseHours !== '00' || formData.jumping.exerciseMinutes !== '00') {
      setErrMsg({ msg: '', type: '' });
    }
  }, [formData.jumping.exerciseHours, formData.jumping.exerciseMinutes]);

  // 칼로리 입력 시 유효해지면 에러 문구만 자동 해제 (사전 노출 방지)
  useEffect(() => {
    if (errMsg.type === 'otherExerciseCalory') {
      const calStr = (formData.other.exerciseCalory || '').trim();
      const calNum = Number(calStr);
      if (calStr && Number.isFinite(calNum) && calNum > 0) {
        setErrMsg({ msg: '', type: '' });
      }
    }
  }, [formData.other.exerciseCalory, errMsg.type]);

  // 팝업 열릴 때 에러 메시지 초기화
  useEffect(() => {
    if (visible) {
      setErrMsg({ msg: '', type: '' });
    }
  }, [visible]);

  // 팝업 표시 함수
  const showPopup = (
    type: 'success' | 'error' | 'alert',
    message: string,
    title?: string,
  ) => {
    switch (type) {
      case 'success':
        setCommonPopup({
          visible: true,
          message: message,
          type: 'default',
        });
        break;
      case 'error':
        setCommonPopup({
          visible: true,
          message: message,
          type: 'warning',
        });
        break;
      case 'alert':
        setCommonPopup({
          visible: true,
          message: '운동 시간을 입력해주세요.',
          type: 'warning',
        });
        break;
    }
  };

  // 현재 월 구하기
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // 전달받은 date를 기반으로 표시할 날짜 정보 생성
  const displayDate = date ? (() => {
    // date가 YYYYMMDD 형식인 경우 파싱
    if (date.length === 8) {
      const year = parseInt(date.substring(0, 4), 10);
      const month = parseInt(date.substring(4, 6), 10);
      const day = parseInt(date.substring(6, 8), 10);
      return { year, month, day };
    } 
    // date가 일(DD)만 있는 경우 현재 년월 사용
    else {
      return {
        year: currentYear,
        month: currentMonth,
        day: parseInt(date, 10)
      };
    }
  })() : null;

  // 시간 옵션 생성 (0-99)
  const hoursOptions = Array.from({length: 100}, (_, i) => {
    return i < 10 ? `0${i}` : i.toString();
  });

  // 분 옵션 생성 (0-55, 5분 단위)
  const minutesOptions = Array.from({length: 12}, (_, i) => {
    const value = i * 5;
    return value < 10 ? `0${value}` : value.toString();
  });

  return (
    <>
      <Modal
        visible={visible && !commonPopup.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.contentWrapper}>
            <ScrollView
              style={styles.container}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{paddingBottom: scale(50)}}
              nestedScrollEnabled={true}
            >
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>유산소 운동 정보</Text>
                  <Text style={styles.headerDate}>
                    {displayDate?.month}월 {displayDate?.day}일
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <View style={{marginBottom: scale(20)}}>
                  <Text style={styles.contentTitleText}>1. 점핑 피트니스</Text>
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitleText}>
                    강도 레벨
                    {errMsg.type === 'exerciseType' && <Text style={styles.errorText}> {errMsg.msg}</Text>}
                  </Text>
                  <SelectButtons 
                    options={['저강도', '중강도', '고강도']}
                    selectedValue={formData.jumping.intensityLevel}
                    setSelectedValue={(value) => updateFormData('jumping', 'intensityLevel', value)}
                    buttonContainerStyle={styles.intensityContainer}
                    buttonStyle={styles.intensityButton}
                    middleItemHasMargin={true}
                    onDeselect={() => {
                      updateFormData('jumping', 'exerciseHours', '00');
                      updateFormData('jumping', 'exerciseMinutes', '00');
                      updateFormData('jumping', 'heartRate', '0');
                      updateFormData('jumping', 'isHeartRateSkipped', false);
                    }}
                  />
                </View>

                <View style={styles.section}>
                  <View style={styles.timeInputRow}>
                    <Text style={styles.sectionTitleText}>운동 시간</Text>
                    {errMsg.type === 'jumpingExerciseHours' && <Text style={styles.errorText}>{errMsg.msg}</Text>}
                  </View>
                  <TimeSelector 
                    hours={formData.jumping.exerciseHours}
                    minutes={formData.jumping.exerciseMinutes}
                    setHours={(value) => updateFormData('jumping', 'exerciseHours', value)}
                    setMinutes={(value) => updateFormData('jumping', 'exerciseMinutes', value)}
                    showHoursSelect={showJumpingHoursSelect}
                    showMinutesSelect={showJumpingMinutesSelect}
                    setShowHoursSelect={setShowJumpingHoursSelect}
                    setShowMinutesSelect={setShowJumpingMinutesSelect}
                    hoursOptions={hoursOptions}
                    minutesOptions={minutesOptions}
                    disabled={!formData.jumping.intensityLevel}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitleText}>심박수</Text>
                  <View style={styles.heartRateContainer}>
                    <View
                      style={[
                        styles.heartRateInputContainer,
                        (formData.jumping.isHeartRateSkipped || !formData.jumping.intensityLevel) && styles.heartRateDisabled,
                      ]}>
                      <TextInput
                        style={styles.heartRateInput}
                        value={formData.jumping.heartRate}
                        onChangeText={(text) => {
                          const numericValue = text.replace(/[^0-9]/g, '');
                          if (formData.jumping.heartRate === '0' && numericValue !== '') {
                            updateFormData('jumping', 'heartRate', numericValue.substring(numericValue.indexOf('0') + 1));
                          } else {
                            updateFormData('jumping', 'heartRate', numericValue);
                            // 입력값이 0이면 평균 심박수로 설정
                            if (numericValue === '0') {
                              const avgHeartRate = getAverageHeartRate(formData.jumping.intensityLevel);
                              updateFormData('jumping', 'heartRate', avgHeartRate);
                            }
                          }
                        }}
                        placeholder="0"
                        placeholderTextColor="#999999"
                        keyboardType="numeric"
                        editable={!formData.jumping.isHeartRateSkipped && !!formData.jumping.intensityLevel}
                        maxLength={3}
                      />
                      <Text style={styles.bpmText}>Bpm</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.skipButton,
                        formData.jumping.isHeartRateSkipped && styles.skipButtonActive,
                        !formData.jumping.intensityLevel && styles.disabledButton
                      ]}
                      onPress={() => {
                        const newSkipValue = !formData.jumping.isHeartRateSkipped;
                        updateFormData('jumping', 'isHeartRateSkipped', newSkipValue);
                        if (newSkipValue) {
                          // 건너뛰기 선택 시 강도 레벨에 따른 평균 심박수 설정
                          const avgHeartRate = getAverageHeartRate(formData.jumping.intensityLevel);
                          updateFormData('jumping', 'heartRate', avgHeartRate);
                        } else {
                          updateFormData('jumping', 'heartRate', '0');
                        }
                      }}
                      disabled={!formData.jumping.intensityLevel}>
                      <Text style={styles.skipButtonText}>건너뛰기</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.heartRateText}>0 입력 또는 건너뛰기 할 시 평균 심박수값으로 측정 됩니다.</Text>
                </View>
              </View>

              <View style={styles.content}>
                <View style={{marginBottom: scale(20)}}>
                  <Text style={styles.contentTitleText}>2. 기타 운동</Text>
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitleText}>
                    운동 종류
                    {errMsg.type === 'exerciseType' && <Text style={styles.errorText}> {errMsg.msg}</Text>}
                  </Text>
                  <SelectButtons 
                    options={exerciseTypes.map(item => item.common_code_name)}
                    selectedValue={formData.other.exerciseType}
                    setSelectedValue={(value) => updateFormData('other', 'exerciseType', value)}
                    buttonContainerStyle={styles.otherExerciseContainer}
                    buttonStyle={styles.otherExerciseButton}
                    onDeselect={() => {
                      updateFormData('other', 'exerciseCalory', '0');
                      updateFormData('other', 'exerciseHours', '00');
                      updateFormData('other', 'exerciseMinutes', '00');
                    }}
                    middleItemHasMargin={true}
                  />

                  <View style={{marginVertical: scale(8)}} />
                  <View style={styles.section}>
                    <View style={styles.timeInputRow}>
                      <Text style={styles.sectionTitleText}>운동 시간</Text>
                      {errMsg.type === 'otherExerciseHours' && <Text style={styles.errorText}>{errMsg.msg}</Text>}
                    </View>
                    <TimeSelector 
                      hours={formData.other.exerciseHours}
                      minutes={formData.other.exerciseMinutes}
                      setHours={(value) => updateFormData('other', 'exerciseHours', value)}
                      setMinutes={(value) => updateFormData('other', 'exerciseMinutes', value)}
                      showHoursSelect={showOtherHoursSelect}
                      showMinutesSelect={showOtherMinutesSelect}
                      setShowHoursSelect={setShowOtherHoursSelect}
                      setShowMinutesSelect={setShowOtherMinutesSelect}
                      hoursOptions={hoursOptions}
                      minutesOptions={minutesOptions}
                      disabled={!formData.other.exerciseType}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={[styles.sectionTitleText, {marginBottom: scale(10)}]}>
                      소모 칼로리
                      {errMsg.type === 'otherExerciseCalory' && <Text style={styles.errorText}> {errMsg.msg}</Text>}
                    </Text>
                    <CaloryInput
                      value={formData.other.exerciseCalory}
                      setValue={(value) => updateFormData('other', 'exerciseCalory', value)}
                      disabled={!formData.other.exerciseType}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>닫기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isLoading && styles.disabledButton]}
                  onPress={handleSave}
                  disabled={isLoading}>
                  <Text style={styles.confirmButtonText}>
                    확인
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <CommonPopup 
        visible={commonPopup.visible}
        message={commonPopup.message}
        type={commonPopup.type}
        onConfirm={() => {
          setCommonPopup({ ...commonPopup, visible: false });
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxHeight: scale(500),
    backgroundColor: '#373737',
    borderRadius: scale(12),
    padding: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontFamily: 'Pretendard-SemiBold',
    marginRight: scale(10),
  },
  headerDate: {
    color: '#CCCCCC',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
  },
  closeButton: {
    padding: scale(5),
  },
  closeButtonText: {
    color: '#D9D9D9',
    fontSize: scale(24),
  },
  content: {
    width: '100%',
    marginBottom: scale(20),
  },
  section: {
    marginBottom: scale(26),
  },
  contentTitleText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
  },
  sectionTitleText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: scale(10),
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    flex: 1,
    backgroundColor: '#242527',
    paddingVertical: scale(10),
    borderRadius: scale(8),
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#43B549',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
  selectedText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectContainer: {
    position: 'relative',
    width: scale(70),
  },
  selectButton: {
    backgroundColor: '#242527',
    borderRadius: scale(8),
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(60),
  },
  selectTimeText: {
    color: '#D9D9D9',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  selectButtonUnit: {
    color: '#D9D9D9',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  selectOptionsContainer: {
    position: 'absolute',
    top: scale(45),
    left: scale(2),
    right: 0,
    width: scale(60),
    backgroundColor: '#242527',
    borderRadius: scale(8),
    zIndex: 10,
    maxHeight: scale(150),
    overflow: 'hidden',
  },
  selectOptionsScroll: {
    maxHeight: scale(150),
  },
  selectOption: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#43B549',
  },
  selectOptionText: {
    color: '#D9D9D9',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  selectedOptionText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  heartRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartRateInputContainer: {
    flexDirection: 'row',
    marginRight: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scale(100),
  },
  heartRateDisabled: {
    opacity: 0.5,
  },
  heartRateInput: {
    color: '#D9D9D9',
    fontSize: scale(16),
    textAlign: 'right',
    minWidth: scale(50),
    fontFamily: 'Pretendard-Medium',
  },
  bpmText: {
    color: '#D9D9D9',
    fontSize: scale(16),
    marginBottom: scale(2),
    marginLeft: scale(5),
    fontFamily: 'Pretendard-Medium',
  },
  skipButton: {
    backgroundColor: '#5C5C5C',
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    borderRadius: scale(8),
    marginBottom: scale(2),
  },
  skipButtonActive: {
    backgroundColor: '#43B549',
  },
  skipButtonText: {
    color: '#D9D9D9',
    fontFamily: 'Pretendard-Medium',
    fontSize: scale(12),
  },
  heartRateText: {
    color: '#FFFFFF',
    fontSize: scale(11),
    marginTop: scale(5),
  },
  otherExerciseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  otherExerciseButton: {
    backgroundColor: '#242527',
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    borderRadius: scale(8),
    marginBottom: scale(10),
    width: '30.3%',
  },
  burnCaloriesInputContainer: {
    flexDirection: 'row',
    marginRight: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#999999',
    borderBottomWidth: 1,
    minWidth: scale(100),
  },
  burnCaloriesInput: {
    color: '#D9D9D9',
    fontSize: scale(16),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'right',
    minWidth: scale(50),
  },
  burnCaloriesText: {
    color: '#D9D9D9',
    fontSize: scale(16),
    marginLeft: scale(5),
    marginBottom: scale(2),
    fontFamily: 'Pretendard-Medium',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -scale(20),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#5C5C5C',
    paddingVertical: scale(12),
    borderRadius: scale(25),
    alignItems: 'center',
    marginRight: scale(10),
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#43B549',
    paddingVertical: scale(12),
    borderRadius: scale(25),
    alignItems: 'center',
    marginLeft: scale(10),
  },
  disabledButton: {
    backgroundColor: '#999999',
    opacity: 0.2,
  },
  cancelButtonText: {
    color: '#D9D9D9',
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnitText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginLeft: scale(2),
    marginRight: scale(18),
    fontFamily: 'Pretendard-Medium',
  },
  errorText: {
    color: '#F04D4D',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    marginBottom: scale(5),
    marginLeft: scale(5),
  },
});

export default ExerciseInfoPopup;
