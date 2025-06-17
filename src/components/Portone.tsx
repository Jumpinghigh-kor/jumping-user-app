import React from 'react';
import { SafeAreaView } from 'react-native';
import IMP from 'iamport-react-native';

interface PortoneProps {
  visible: boolean;
  paymentData: {
    amount: number;
    currency: string;
    merchantOrderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    description?: string;
  };
  onPaymentSuccess: (result: any) => void;
  onPaymentFailure: (error: any) => void;
  onCancel: () => void;
}

const Portone: React.FC<PortoneProps> = ({
  visible,
  paymentData,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel
}) => {
  if (!visible) {
    return null;
  }

  const impPaymentData = {
    // pg: 'html5_inicis', // 운영 모드
    pg: 'html5_inicis', // 테스트도 html5_inicis 사용
    pay_method: 'card',
    name: paymentData.description,
    merchant_uid: paymentData.merchantOrderId,
    amount: paymentData.amount,
    buyer_name: paymentData.customerName,
    buyer_tel: paymentData.customerPhone,
    buyer_email: paymentData.customerEmail,
    app_scheme: 'jumpinguser',
    escrow: false,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <IMP.Payment
        userCode="imp75073205" // 실제 아임포트 가맹점 식별코드 (운영용)
        data={impPaymentData}
        callback={response => {
          if (response.imp_success === 'true') {
            onPaymentSuccess(response);
          } else {
            onPaymentFailure(response);
          }
        }}
      />
    </SafeAreaView>
  );
};

export default Portone;
