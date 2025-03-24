/**
 * 날짜 형식 변환 유틸리티 함수
 */

/**
 * YYYYMMDDHHIISS 형식의 문자열을 YYYY-MM-DD 형식으로 변환
 * @param dateStr YYYYMMDDHHIISS 형식의 날짜 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDateYYYYMMDD = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return '';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
};

/**
 * YYYYMMDDHHIISS 형식의 문자열을 YYYY-MM-DD HH:II 형식으로 변환
 * @param dateStr YYYYMMDDHHIISS 형식의 날짜 문자열
 * @returns YYYY-MM-DD HH:II 형식의 날짜 문자열
 */
export const formatDateYYYYMMDDHHII = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 12) return '';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const hour = dateStr.substring(8, 10);
  const minute = dateStr.substring(10, 12);
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}; 