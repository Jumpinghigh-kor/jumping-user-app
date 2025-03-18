import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import {scale} from '../utils/responsive';
import {useAuth} from '../hooks/useAuth';
import {insertMemberExercise} from '../api/services/memberExercise';

interface AttendancePopupProps {
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

const AttendancePopup: React.FC<AttendancePopupProps> = ({
  visible,
  date,
  onClose,
}) => {
  const {memberInfo} = useAuth();
  const [intensityLevel, setIntensityLevel] = useState<string>('저강도');
  const [exerciseHours, setExerciseHours] = useState<string>('0');
  const [exerciseMinutes, setExerciseMinutes] = useState<string>('0');
  const [heartRate, setHeartRate] = useState<string>('');
  const [showHoursSelect, setShowHoursSelect] = useState(false);
  const [showMinutesSelect, setShowMinutesSelect] = useState(false);
  const [isHeartRateSkipped, setIsHeartRateSkipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSave = async () => {
    if (!memberInfo?.mem_id) {
      Alert.alert('오류', '회원 정보를 찾을 수 없습니다.');
      return;
    }

    // 운동 시간 유효성 검사
    if (exerciseHours === '0' && exerciseMinutes === '0') {
      Alert.alert('알림', '운동 시간을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 운동 시간 포맷팅 (예: 1시 1분 -> 0101)
      const formattedHours = formatTimeValue(exerciseHours);
      const formattedMinutes = formatTimeValue(exerciseMinutes);
      const exerciseTime = `${formattedHours}${formattedMinutes}`;

      // 심박수 처리 (건너뛰기 또는 0인 경우 null)
      const heartRateValue =
        isHeartRateSkipped || heartRate === '0' || heartRate === ''
          ? null
          : heartRate;

      // 날짜 포맷팅 (YYYY-MM-DD)
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const selectedDate = date
        ? date.padStart(2, '0')
        : today.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}${month}${selectedDate}`;

      // API 요청 데이터
      const requestData = {
        mem_id: Number(memberInfo.mem_id),
        exercise_dt: formattedDate,
        exercise_time: exerciseTime,
        intensity_level: getIntensityLevelValue(intensityLevel),
        heart_rate: heartRateValue,
        reg_dt: `${year}${month}`,
        reg_id: Number(memberInfo.mem_id),
        mod_dt: null,
        mod_id: null,
      };

      // API 호출
      const response = await insertMemberExercise(requestData);

      if (response.success) {
        Alert.alert('성공', '운동 정보가 저장되었습니다.');
        onClose();
      } else {
        Alert.alert(
          '오류',
          response.message || '운동 정보 저장에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('운동 정보 저장 오류:', error);
      Alert.alert('오류', '운동 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 월 구하기
  const currentMonth = new Date().getMonth() + 1;

  // 시간 옵션 생성 (0-99)
  const hoursOptions = Array.from({length: 100}, (_, i) => i.toString());

  // 분 옵션 생성 (0-55, 5분 단위)
  const minutesOptions = Array.from({length: 12}, (_, i) => (i * 5).toString());

  // 심박수 건너뛰기 토글
  const toggleHeartRateSkip = () => {
    setIsHeartRateSkipped(!isHeartRateSkipped);
    if (!isHeartRateSkipped) {
      setHeartRate('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
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
              <Text style={styles.sectionTitle}>운동 시간</Text>
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
                    onChangeText={setHeartRate}
                    placeholder="0"
                    placeholderTextColor="#999999"
                    keyboardType="number-pad"
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  heartRateDisabled: {
    opacity: 0.5,
  },
  heartRateInput: {
    color: '#FFFFFF',
    fontSize: scale(16),
    paddingLeft: scale(50),
    textAlign: 'right',
    maxWidth: scale(50),
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
  },
});

export default AttendancePopup;
