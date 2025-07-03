import {
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    View,
    Platform,
    Image,
  } from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import React, {useEffect, useState, useCallback} from 'react';
import {WebView} from 'react-native-webview';
import { getEventAppList } from '../api/services/eventAppService';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { supabase } from '../utils/supabaseClient';
  
const Event = ({navigation, route}) => {
  const {item} = route.params || {};
  const [eventData, setEventData] = useState({});
  const [contentImageUrl, setContentImageUrl] = useState('');
  const [buttonImageUrl, setButtonImageUrl] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  console.log('item',item);
  useFocusEffect(
    useCallback(() => {
      const fetchEventData = async () => {
        if (item.event_app_id) {
          try {
            const response = await getEventAppList({ event_app_id: item.event_app_id });

            if (response.success && response.data) {
              setEventData(response.data);
              // Supabase 이미지 URL 처리
              if (Array.isArray(response.data)) {
                response.data.forEach((imageData: any) => {
                  if (imageData.file_path && imageData.file_name) {
                    const imagePath = `${imageData.file_division}/${imageData.file_name}`.replace(/^\//, '');
                    
                    try {
                      const { data } = supabase.storage
                        .from('event')
                        .getPublicUrl(imagePath);
                      if (data && data.publicUrl) {
                        if (imageData.event_img_type === 'content') {
                          setContentImageUrl(data.publicUrl);
                        } else if (imageData.event_img_type === 'button') {
                          setButtonImageUrl(data.publicUrl);
                          setButtonLink(imageData.navigation_path);
                        }
                      }
                    } catch (err) {
                      console.error('Supabase URL 생성 실패:', err);
                    }
                  }
                });
              }
            }
          } catch (error) {
            console.error('이벤트 데이터 로드 실패:', error);
          }
        }
      };

      fetchEventData();
    }, [item.event_app_id]),
  );
  
  return (
    <View style={styles.container}>
      <CommonHeader
        title={'이벤트'}
        backgroundColor={'#ffffff'}
        titleColor={'#202020'}
        backIcon={IMAGES.icons.arrowLeftBlack}
        />
      <WebView
        source={{
          html: `
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0">
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  background-color: white;
                  overflow-x: hidden;
                  overflow-y: scroll;
                  -webkit-overflow-scrolling: touch;
                }
                html {
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                }
                html::-webkit-scrollbar {
                  width: 0 !important;
                  display: none;
                }
                img {
                  width: 100%;
                  height: auto;
                  display: block;
                }
                .container {
                  width: 100%;
                  overflow: auto;
                  -ms-overflow-style: none;  /* IE and Edge */
                  scrollbar-width: none;  /* Firefox */
                }
                .container::-webkit-scrollbar {
                  display: none;  /* Chrome, Safari, Opera */
                }
                .button-image {
                  width: 100%;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <img src="${contentImageUrl}" />
                <img src="${buttonImageUrl}" id="buttonImage" class="button-image" />
              </div>
              <script>
                document.getElementById('buttonImage').addEventListener('click', function() {
                  window.ReactNativeWebView.postMessage('buttonClicked');
                });
                document.addEventListener('DOMContentLoaded', function() {
                  window.ReactNativeWebView.postMessage('loaded');
                });
              </script>
            </body>
            </html>
          `,
        }}
        onMessage={event => {
          if (event.nativeEvent.data === 'buttonClicked') {
            navigation.navigate('MainTab', {screen: buttonLink});
          }
        }}
        style={{flex: 1}}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default Event;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    marginTop: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 0.35,
  },
  buttonImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 3,
  },
});