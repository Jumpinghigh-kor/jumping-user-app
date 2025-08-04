import { apiRequest } from '../apiRequest';

// Delivery Tracker API 설정
const DELIVERY_TRACKER_CLIENT_ID = process.env.DELIVERY_TRACKER_CLIENT_ID; // 발급받은 클라이언트 ID
const DELIVERY_TRACKER_CLIENT_SECRET = process.env.DELIVERY_TRACKER_CLIENT_SECRET; // 발급받은 클라이언트 시크릿
const DELIVERY_TRACKER_BASE_URL = process.env.DELIVERY_TRACKER_BASE_URL;

// 캐시 및 레이트 리미팅을 위한 변수들
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1초 간격
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

// 택배사 코드 맵핑 (Delivery Tracker 기준)
const COMPANY_CODES = {
  'CJ': 'kr.cjlogistics',
  'ROZEN': 'kr.logen',
  'HANJIN': 'kr.hanjin',
  'LOTTE': 'kr.lotte',
  'EPOST': 'kr.epost'
};

// 레이트 리미팅 함수
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// OAuth2 토큰 획득 함수
const getOAuth2Token = async () => {
  try {
    const response = await fetch('https://auth.tracker.delivery/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${DELIVERY_TRACKER_CLIENT_ID}:${DELIVERY_TRACKER_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    } else {
      throw new Error('OAuth2 토큰 획득 실패');
    }
  } catch (error) {
    console.error('OAuth2 토큰 획득 에러:', error);
    throw error;
  }
};

// GraphQL 요청 함수 (OAuth2 방식)
const graphqlRequest = async (query, variables = {}) => {
  try {
    // OAuth2 토큰 획득
    const accessToken = await getOAuth2Token();
    
    const response = await fetch(DELIVERY_TRACKER_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }
    
    return data.data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
};

// 배송 추적 정보 조회
export const getTrackingInfo = async (companyName, trackingNumber) => {
  try {
    console.log('companyName', companyName);
    console.log('trackingNumber', trackingNumber);
    
    const carrierId = COMPANY_CODES[companyName];
    if (!carrierId) {
      return {
        success: false,
        error: '지원하지 않는 택배사입니다.'
      };
    }

    // 캐시 키 생성
    const cacheKey = `${carrierId}_${trackingNumber}`;
    
    // 캐시에서 확인
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log('캐시에서 데이터 반환');
      return {
        success: true,
        data: cachedData.data
      };
    }

    // 레이트 리미팅 적용
    await waitForRateLimit();

    // 전체 배송 이력을 포함한 쿼리
    const query = `
      query Track($carrierId: ID!, $trackingNumber: String!) {
        track(carrierId: $carrierId, trackingNumber: $trackingNumber) {
          lastEvent {
            time
            status {
              code
              name
            }
            description
            location {
              name
            }
          }
          events(first: 20) {
            edges {
              node {
                time
                status {
                  code
                  name
                }
                description
                location {
                  name
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      carrierId,
      trackingNumber
    };

    const data = await graphqlRequest(query, variables);
    const trackInfo = data.track;
    
    const result = {
      company: companyName,
      trackingNumber: trackingNumber,
      status: trackInfo.lastEvent?.status?.name || 'Unknown',
      statusCode: trackInfo.lastEvent?.status?.code || 'UNKNOWN',
      receiver: '', 
      sender: '', 
      trackingDetails: trackInfo.events?.edges?.map(edge => ({
        date: edge.node.time,
        location: edge.node.location?.name || '',
        status: edge.node.status?.name || '',
        statusCode: edge.node.status?.code || '',
        description: edge.node.description || ''
      })) || [],
      rawData: trackInfo
    };

    // 캐시에 저장
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('배송 추적 조회 실패:', error);
    
    // 할당량 초과 에러인 경우 특별 처리
    if (error.message && error.message.includes('rate limit exceeded')) {
      return {
        success: false,
        error: 'API 호출 제한에 걸렸습니다. 잠시 후 다시 시도해주세요.',
        isRateLimit: true
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// 택배사 목록 조회
export const getCompanyList = async () => {
  try {
    const query = `
      query Carriers($first: Int!) {
        carriers(first: $first) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;

    const variables = {
      first: 50
    };

    const data = await graphqlRequest(query, variables);
    const carriers = data.carriers.edges.map(edge => ({
      id: edge.node.id,
      name: edge.node.name,
      code: edge.node.id
    }));
    
    return {
      success: true,
      data: carriers
    };
  } catch (error) {
    console.error('택배사 목록 조회 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 택배사 검색 (텍스트로 검색)
export const searchCarriers = async (searchText) => {
  try {
    const query = `
      query Carriers($searchText: String!, $first: Int!) {
        carriers(searchText: $searchText, first: $first) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;

    const variables = {
      searchText,
      first: 10
    };

    const data = await graphqlRequest(query, variables);
    const carriers = data.carriers.edges.map(edge => ({
      id: edge.node.id,
      name: edge.node.name,
      code: edge.node.id
    }));
    
    return {
      success: true,
      data: carriers
    };
  } catch (error) {
    console.error('택배사 검색 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 택배사 자동 감지 (운송장 번호로 택배사 추천)
export const getRecommendedCarriers = async (trackingNumber) => {
  try {
    const query = `
      query RecommendCarriers($trackingNumber: String!) {
        recommendCarriers(trackingNumber: $trackingNumber) {
          id
          name
          displayName
        }
      }
    `;

    const variables = {
      trackingNumber
    };

    const data = await graphqlRequest(query, variables);
    const carriers = data.recommendCarriers?.map(carrier => ({
      id: carrier.id,
      name: carrier.displayName || carrier.name,
      code: carrier.id
    })) || [];
    
    return {
      success: true,
      data: carriers
    };
  } catch (error) {
    console.error('택배사 추천 조회 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 테스트 실행 (개발 중에만 사용)
// testTracking(); 