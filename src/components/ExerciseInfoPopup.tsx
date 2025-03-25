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
import {insertMemberExercise, getMemberExerciseInfo, updateMemberExercise} from '../api/services/memberExercise';

interface ExerciseInfoPopupProps {
  visible: boolean;
  date?: string;
  onClose: () => void;
}

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

const ExerciseInfoPopup: React.FC<ExerciseInfoPopupProps> = ({
  visible,
  date,
  onClose,
}) => {
  const {memberInfo} = useAuth();
  const [intensityLevel, setIntensityLevel] = useState<string>('저강도');
  const [exerciseHours, setExerciseHours] = useState<string>('00');
  const [exerciseMinutes, setExerciseMinutes] = useState<string>('00');
  const [heartRate, setHeartRate] = useState<string>('0');
  const [showHoursSelect, setShowHoursSelect] = useState(false);
  const [showMinutesSelect, setShowMinutesSelect] = useState(false);
  const [isHeartRateSkipped, setIsHeartRateSkipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  // 강도 레벨 매핑
  const getIntensityLevelValue = (level: string): string => {
    switch (level) {
      case '저강도':
        return 'LOW';
      case '중강도':
        return 'MODERATE';
      case '고강도':
        return 'HIGH';
      default:
        return 'LOW';
    }
  };

  // 시간 포맷팅 (한 자리 수일 경우 앞에 0 추가)
  const formatTimeValue = (value: string): string => {
    return value.padStart(2, '0');
  };

  // 날짜 포맷팅 함수
  const formatDate = (date: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const selectedDate = date.padStart(2, '0');
    return `${year}${month}${selectedDate}`;
  };

  // 운동 정보 조회
  const fetchExerciseData = async () => {
    if (!memberInfo?.mem_id || !date) return;

    try {
      const formattedDate = formatDate(date);
      // mem_id를 문자열에서 숫자로 변환하여 전달
      const memId = typeof memberInfo.mem_id === 'string' ? parseInt(memberInfo.mem_id, 10) : memberInfo.mem_id;
      const response = await getMemberExerciseInfo(memId, formattedDate);

      if (response.success && response.data && (Array.isArray(response.data) ? response.data.length > 0 : true)) {
        const exerciseData = Array.isArray(response.data) 
          ? response.data[0] 
          : response.data;
        
        if (exerciseData && exerciseData.exercise_time) {
          // exercise_id 저장
          if (exerciseData.exercise_id) {
            setExerciseId(exerciseData.exercise_id);
          }
          
          // 운동 시간 분리 (HHMM 형식에서 시와 분으로)
          const hours = exerciseData.exercise_time.substring(0, 2);
          const minutes = exerciseData.exercise_time.substring(2, 4);
          
          // 강도 레벨 매핑
          const intensityMap: { [key: string]: string } = {
            'LOW': '저강도',
            'MODERATE': '중강도',
            'HIGH': '고강도'
          };

          setExerciseHours(hours);
          setExerciseMinutes(minutes);
          setIntensityLevel(intensityMap[exerciseData.intensity_level] || '저강도');
          
          // 심박수 처리
          if (exerciseData.heart_rate) {
            setHeartRate(exerciseData.heart_rate.toString());
            setIsHeartRateSkipped(false);
          } else {
            setHeartRate('0');
            setIsHeartRateSkipped(true);
          }
        } else {
          // 데이터가 있지만 필요한 정보가 없는 경우 초기화
          resetExerciseData();
        }
      } else {
        // 데이터가 없는 경우 초기화
        resetExerciseData();
      }
    } catch (error) {
      // 에러 발생 시에도 초기화
      resetExerciseData();
    }
  };

  // 운동 정보 초기화 함수
  const resetExerciseData = () => {
    setIntensityLevel('저강도');
    setExerciseHours('00');
    setExerciseMinutes('00');
    setHeartRate('0');
    setIsHeartRateSkipped(false);
    setExerciseId(null);
  };

  // isHeartRateSkipped 상태가 변경될 때 heartRate 값을 설정
  useEffect(() => {
    if (isHeartRateSkipped) {
      setHeartRate('');
    } else if (heartRate === '') {
      setHeartRate('0');
    }
  }, [isHeartRateSkipped]);

  // visible이 true일 때 데이터 조회
  useEffect(() => {
    if (visible) {
      fetchExerciseData();
      setTimeError(null);
    }
  }, [visible, date]);

  // 시간 변경 시 에러 메시지 초기화
  useEffect(() => {
    if (exerciseHours !== '00' || exerciseMinutes !== '00') {
      setTimeError(null);
    }
  }, [exerciseHours, exerciseMinutes]);

  // 팝업 표시 함수
  const showPopup = (
    type: 'success' | 'error' | 'alert',
    message: string,
    title?: string,
  ) => {
    switch (type) {
      case 'success':
        Alert.alert('성공', message, [
          {
            text: '확인',
            onPress: onClose,
          },
        ]);
        break;
      case 'error':
        Alert.alert(title || '오류', message);
        break;
      case 'alert':
        Alert.alert('알림', '운동 시간을 입력해주세요.');
        break;
    }
  };

  const handleSave = async () => {
    if (!memberInfo?.mem_id) {
      showPopup('error', '회원 정보를 찾을 수 없습니다.');
      return;
    }

    // 운동 시간 유효성 검사
    if (exerciseHours === '00' && exerciseMinutes === '00') {
      setTimeError('운동 시간을 입력해주세요.');
      return;
    }
    
    // 시가 0이고 분도 0인 경우 (변환 전 값 확인)
    if ((exerciseHours === '0' || exerciseHours === '00') && 
        (exerciseMinutes === '0' || exerciseMinutes === '00')) {
      setTimeError('운동 시간을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 운동 시간 포맷팅 (예: 1시 1분 -> 0101)
      const formattedHours = formatTimeValue(exerciseHours);
      const formattedMinutes = formatTimeValue(exerciseMinutes);
      const exerciseTime = `${formattedHours}${formattedMinutes}`;

      // 심박수 처리 (건너뛰기와 빈 문자열은 null로 처리, 나머지는 그대로 전송)
      // isHeartRateSkipped가 true인 경우(건너뛰기 활성화) 또는 빈 문자열이면 null, 아니면 입력값 그대로 전송
      const heartRateValue = isHeartRateSkipped || heartRate === '' ? null : heartRate;

      // 날짜 포맷팅 (YYYY-MM-DD)
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const selectedDate = date
        ? date.padStart(2, '0')
        : today.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}${month}${selectedDate}`;
      
      // exerciseId가 있으면 업데이트, 없으면 인서트
      let response;
      
      if (exerciseId) {
        // API 업데이트 요청 데이터
        const updateData = {
          exercise_id: exerciseId,
          mem_id: Number(memberInfo.mem_id),
          exercise_dt: formattedDate,
          exercise_time: exerciseTime,
          intensity_level: getIntensityLevelValue(intensityLevel),
          heart_rate: heartRateValue,
          mod_dt: `${year}${month}${selectedDate}`,
          mod_id: Number(memberInfo.mem_id),
        };
        
        // 업데이트 API 호출
        response = await updateMemberExercise(updateData);
      } else {
        // API 인서트 요청 데이터
        const insertData = {
          mem_id: Number(memberInfo.mem_id),
          exercise_dt: formattedDate,
          exercise_time: exerciseTime,
          intensity_level: getIntensityLevelValue(intensityLevel),
          heart_rate: heartRateValue,
          reg_dt: `${year}${month}`,
          reg_id: Number(memberInfo.mem_id),
          mod_dt: null,
          mod_id: null
        };
        
        // 인서트 API 호출
        response = await insertMemberExercise(insertData);
      }

      if (response.success) {
        showPopup('success', '운동 정보가 저장되었습니다.');
      } else {
        showPopup('error', response.message || '운동 정보 저장에 실패했습니다.');
      }
    } catch (error) {
      showPopup('error', '운동 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 월 구하기
  const currentMonth = new Date().getMonth() + 1;

  // 시간 옵션 생성 (0-99)
  const hoursOptions = Array.from({length: 100}, (_, i) => {
    return i < 10 ? `0${i}` : i.toString();
  });

  // 분 옵션 생성 (0-55, 5분 단위)
  const minutesOptions = Array.from({length: 12}, (_, i) => {
    const value = i * 5;
    return value < 10 ? `0${value}` : value.toString();
  });

  // 심박수 건너뛰기 토글
  const toggleHeartRateSkip = () => {
    const newSkipValue = !isHeartRateSkipped;
    
    // 상태 업데이트를 즉시 반영하기 위해 콜백 사용
    setIsHeartRateSkipped(newSkipValue);
    
    if (newSkipValue) {
      // 건너뛰기 활성화시 빈 값으로
      setHeartRate('');
    } else {
      // 건너뛰기 비활성화시 기본값 0으로
      setHeartRate('0');
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}>
        <View style={styles.absolute}>
          <View style={styles.overlay} />
          <View style={styles.contentWrapper}>
            <View style={styles.container}>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>운동 정보</Text>
                  <Text style={styles.headerDate}>
                    {currentMonth}월 {date}일
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                {/* 1. 강도 레벨 선택 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>강도 레벨</Text>
                  <View style={styles.intensityContainer}>
                    {['저강도', '중강도', '고강도'].map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.intensityButton,
                          intensityLevel === level && styles.selectedButton,
                        ]}
                        onPress={() => setIntensityLevel(level)}>
                        <Text
                          style={[
                            styles.intensityText,
                            intensityLevel === level && styles.selectedText,
                          ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 2. 운동 시간 입력 (시:분) */}
                <View style={styles.section}>
                  <View style={styles.timeInputRow}>
                    <Text style={styles.sectionTitle}>운동 시간</Text>
                    {timeError && <Text style={styles.errorText}>{timeError}</Text>}
                  </View>
                  <View style={styles.timeInputRow}>
                    {/* 시간 선택 */}
                    <View style={styles.timeItem}>
                      <View style={styles.selectContainer}>
                        <TouchableOpacity
                          style={styles.selectButton}
                          onPress={() => {
                            setShowHoursSelect(!showHoursSelect);
                            setShowMinutesSelect(false);
                          }}>
                          <Text style={styles.selectButtonText}>
                            {exerciseHours}
                          </Text>
                        </TouchableOpacity>

                        {showHoursSelect && (
                          <View style={styles.selectOptionsContainer}>
                            <ScrollView style={styles.selectOptionsScroll}>
                              {hoursOptions.map(hour => (
                                <SelectOption
                                  key={`hour-${hour}`}
                                  value={hour}
                                  selected={hour === exerciseHours}
                                  onSelect={() => {
                                    setExerciseHours(hour);
                                    setShowHoursSelect(false);
                                  }}
                                />
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      <Text style={styles.timeUnitText}>시</Text>
                    </View>

                    <Text style={styles.timeSeparator}>:</Text>

                    {/* 분 선택 */}
                    <View style={styles.timeItem}>
                      <View style={styles.selectContainer}>
                        <TouchableOpacity
                          style={styles.selectButton}
                          onPress={() => {
                            setShowMinutesSelect(!showMinutesSelect);
                            setShowHoursSelect(false);
                          }}>
                          <Text style={styles.selectButtonText}>
                            {exerciseMinutes}
                          </Text>
                        </TouchableOpacity>

                        {showMinutesSelect && (
                          <View style={styles.selectOptionsContainer}>
                            <ScrollView style={styles.selectOptionsScroll}>
                              {minutesOptions.map(minute => (
                                <SelectOption
                                  key={`minute-${minute}`}
                                  value={minute}
                                  selected={minute === exerciseMinutes}
                                  onSelect={() => {
                                    setExerciseMinutes(minute);
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
                </View>

                {/* 3. 심박수 입력 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>심박수</Text>
                  <View style={styles.heartRateContainer}>
                    <View
                      style={[
                        styles.heartRateInputContainer,
                        isHeartRateSkipped && styles.heartRateDisabled,
                      ]}>
                      <TextInput
                        style={styles.heartRateInput}
                        value={heartRate}
                        onChangeText={(text) => {
                          // 숫자만 허용
                          const numericValue = text.replace(/[^0-9]/g, '');
                          // 첫 입력 시 초기값 0 지우기
                          if (heartRate === '0' && numericValue !== '') {
                            setHeartRate(numericValue.substring(numericValue.indexOf('0') + 1));
                          } else {
                            setHeartRate(numericValue);
                          }
                        }}
                        placeholder="0"
                        placeholderTextColor="#999999"
                        keyboardType="numeric"
                        editable={!isHeartRateSkipped}
                        maxLength={3}
                      />
                      <Text style={styles.bpmText}>Bpm</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.skipButton,
                        isHeartRateSkipped && styles.skipButtonActive,
                      ]}
                      onPress={toggleHeartRateSkip}>
                      <Text style={styles.skipButtonText}>건너뛰기</Text>
                    </TouchableOpacity>
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
                    {isLoading ? '저장 중...' : '확인'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  contentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  container: {
    width: '85%',
    backgroundColor: '#333333',
    borderRadius: scale(12),
    padding: scale(20),
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: 'bold',
    marginRight: scale(10),
  },
  headerDate: {
    color: '#CCCCCC',
    fontSize: scale(14),
  },
  closeButton: {
    padding: scale(5),
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: scale(24),
    fontWeight: 'bold',
  },
  content: {
    width: '100%',
    marginBottom: scale(20),
  },
  section: {
    marginBottom: scale(20),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
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
    marginHorizontal: scale(5),
    borderWidth: 1,
    borderColor: '#444444',
  },
  selectedButton: {
    backgroundColor: '#6BC46A',
    borderColor: '#6BC46A',
  },
  intensityText: {
    color: '#FFFFFF',
    fontSize: scale(14),
  },
  selectedText: {
    fontWeight: 'bold',
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
  timeInput: {
    backgroundColor: '#242527',
    borderRadius: scale(8),
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444444',
    width: scale(60),
    textAlign: 'center',
  },
  timeLabel: {
    color: '#FFFFFF',
    marginLeft: scale(5),
    fontSize: scale(14),
  },
  timeSeparator: {
    color: '#FFFFFF',
    fontSize: scale(20),
    marginHorizontal: scale(10),
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
    borderWidth: 1,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(60),
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
  },
  selectButtonUnit: {
    color: '#CCCCCC',
    fontSize: scale(14),
  },
  selectOptionsContainer: {
    position: 'absolute',
    top: scale(45),
    left: 0,
    right: 0,
    backgroundColor: '#242527',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#444444',
    zIndex: 10,
    maxHeight: scale(150),
  },
  selectOptionsScroll: {
    maxHeight: scale(150),
  },
  selectOption: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#6BC46A',
  },
  selectOptionText: {
    color: '#FFFFFF',
    fontSize: scale(14),
  },
  selectedOptionText: {
    fontWeight: 'bold',
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
    borderBottomColor: '#999999',
    borderBottomWidth: 1,
    minWidth: scale(100),
  },
  heartRateDisabled: {
    opacity: 0.5,
  },
  heartRateInput: {
    color: '#FFFFFF',
    fontSize: scale(16),
    textAlign: 'right',
    minWidth: scale(50),
  },
  bpmText: {
    color: '#999999',
    fontSize: scale(16),
    marginBottom: scale(2),
    marginLeft: scale(5),
  },
  skipButton: {
    backgroundColor: '#444444',
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    borderRadius: scale(8),
  },
  skipButtonActive: {
    backgroundColor: '#6BC46A',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444444',
    paddingVertical: scale(12),
    borderRadius: scale(25),
    alignItems: 'center',
    marginRight: scale(10),
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#6BC46A',
    paddingVertical: scale(12),
    borderRadius: scale(25),
    alignItems: 'center',
    marginLeft: scale(10),
  },
  disabledButton: {
    backgroundColor: '#999999',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnitText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    marginLeft: scale(5),
  },
  errorText: {
    color: '#F04D4D',
    fontSize: scale(12),
    marginBottom: scale(5),
    marginLeft: scale(5),
  },
});

export default ExerciseInfoPopup;
