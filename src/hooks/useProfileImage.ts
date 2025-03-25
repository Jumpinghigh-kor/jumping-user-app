import { useState } from 'react';
import { getMemberImageFile } from '../api/services/profileService';
import { supabase } from '../utils/supabaseClient';

export const useProfileImage = (memberId: string | undefined) => {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const loadProfileImage = async () => {
    try {
      if (memberId) {
        const response = await getMemberImageFile(memberId);
        
        if (response.success && response.data) {
          // 백엔드 응답에서 파일명 또는 URL 추출
          const fileData = response.data[0] as any;
          
          // fileData.file_name이 있으면 사용, 없으면 file_url에서 추출 시도
          let fileName = '';
          
          if (fileData.file_name) {
            // 백엔드에서 파일명을 직접 제공하는 경우
            fileName = fileData.file_name;
          } else if (fileData.file_url) {
            // URL에서 파일명을 추출하는 경우
            try {
              const urlParts = fileData.file_url.split('/');
              fileName = urlParts[urlParts.length - 1];
            } catch (e) {
              
            }
          }
          
          // 파일명이 있으면 Supabase에서 이미지 URL 생성
          if (fileName) {
            // Supabase 스토리지에서 이미지 URL 가져오기
            const filePath = `profile/${fileName}`;
            const { data: { publicUrl } } = supabase
              .storage
              .from('profile')
              .getPublicUrl(filePath);
            
            setProfileImageUrl(publicUrl);
          } else if (fileData.file_url) {
            // 파일명 추출에 실패했지만 URL이 있는 경우 직접 사용
            setProfileImageUrl(fileData.file_url);
          } else {
            // 파일명도 URL도 없는 경우 기본 이미지 사용
            setProfileImageUrl(undefined);
          }
        } else {
          // 응답 실패 시 기본 이미지 사용
          setProfileImageUrl(undefined);
        }
      }
    } catch (error) {
      setProfileImageUrl(undefined);
    }
  };

  return {
    profileImageUrl,
    loadProfileImage
  };
}; 