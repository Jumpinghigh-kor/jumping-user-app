import { useState } from 'react';

// 팝업 타입 정의
type PopupType = 'default' | 'warning' | 'confirm';

// 팝업 훅 인터페이스
interface UsePopupReturn {
  popup: {
    visible: boolean;
    type: PopupType;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  showWarningPopup: (message: string) => void;
  showConfirmPopup: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  closePopup: () => void;
}

/**
 * 팝업 관리를 위한 커스텀 훅
 */
export const usePopup = (): UsePopupReturn => {
  // 팝업 상태 관리
  const [popup, setPopup] = useState({
    visible: false,
    type: 'default' as PopupType,
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // 팝업 닫기
  const closePopup = () => {
    setPopup(prev => ({ ...prev, visible: false }));
  };

  // 경고 팝업 표시 (한 개의 확인 버튼만 있음)
  const showWarningPopup = (message: string) => {
    setPopup({
      visible: true,
      type: 'warning',
      message,
      onConfirm: closePopup,
      onCancel: closePopup
    });
  };

  // 확인 팝업 표시 (확인/취소 버튼 모두 있음)
  const showConfirmPopup = (message: string, onConfirm: () => void, onCancel = closePopup) => {
    setPopup({
      visible: true,
      type: 'confirm',
      message,
      onConfirm: () => {
        onConfirm();
        closePopup();
      },
      onCancel: () => {
        onCancel();
        closePopup();
      }
    });
  };

  return {
    popup,
    showWarningPopup,
    showConfirmPopup,
    closePopup
  };
}; 