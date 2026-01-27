import React, { useMemo, useCallback } from 'react';
import { Alert, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';

/**
 * WebView(다음 주소 검색) → RN으로 전달되는 주소 데이터 타입
 */
type AddressPayload = {
  zonecode?: string;       // 우편번호
  address?: string;        // 선택된 주소(도로명/지번 fallback)
  roadAddress?: string;    // 도로명 주소
  jibunAddress?: string;   // 지번 주소
  buildingName?: string;   // 건물명
  bname?: string;          // 법정동명
};

export default function AddressSearchWebViewScreen() {
  const navigation = useNavigation<any>();

  /**
   * 주소 데이터를 받아 AddressEdit 화면으로 이동시키는 공통 함수
   * (postMessage / 커스텀 스킴 어떤 경로로 오든 여기로 모인다)
   */
  const goAddressEdit = useCallback(
    (payload: AddressPayload) => {
      const postalCode = payload.zonecode ?? '';
      const addressLine1 =
        payload.roadAddress?.trim() ||
        payload.address?.trim() ||
        payload.jibunAddress?.trim() ||
        '';

      // 주소 데이터가 비정상일 경우 방어
      if (!postalCode && !addressLine1) {
        Alert.alert('오류', '주소 정보 payload가 비어있습니다.');
        return;
      }

      // AddressEdit은 실제 네비게이션 스택에 등록된 라우트여야 한다
      navigation.navigate('AddressEdit', { postalCode, addressLine1 });
    },
    [navigation]
  );

  /**
   * WebView에 로드될 HTML
   * - 다음(카카오) 우편번호 서비스 embed
   * - postMessage + 커스텀 스킴 fallback 이중 브리지 구조
   */
  const html = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />

        <!-- 다음 우편번호 API -->
        <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>

        <style>
          /* 모바일 WebView에서 화면을 꽉 채우기 위한 기본 설정 */
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #fff;
          }
          #wrap {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>

      <body>
        <!-- 다음 주소 검색 UI가 embed될 영역 -->
        <div id="wrap"></div>

        <script>
          (function () {

            /**
             * RN으로 데이터 전달하는 공통 함수
             * 1) window.ReactNativeWebView.postMessage (정석)
             * 2) 커스텀 스킴(kimsrecipe://...) fallback
             */
            function sendToRN(payload) {
              try {
                var str = JSON.stringify(payload);

                // RN WebView에서 정상적인 통신 경로
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(str);
                }

                // 일부 환경에서 postMessage가 막히는 경우 대비한 fallback
                var q = encodeURIComponent(str);
                window.location.href = "kimsrecipe://address?data=" + q;
              } catch (e) {
                alert("sendToRN error: " + e);
              }
            }

            /**
             * 다음 우편번호 검색 UI 실행
             */
            function openPostcode() {
              // 외부 스크립트 로드 실패 방어
              if (!window.daum || !window.daum.Postcode) {
                sendToRN({ __error: "daum.Postcode not loaded" });
                return;
              }

              new daum.Postcode({
                oncomplete: function (data) {
                  // 도로명 → 일반 주소 → 지번 주소 순으로 fallback
                  var addr = data.roadAddress || data.address || data.jibunAddress || "";

                  sendToRN({
                    zonecode: data.zonecode,
                    address: addr,
                    roadAddress: data.roadAddress,
                    jibunAddress: data.jibunAddress,
                    buildingName: data.buildingName,
                    bname: data.bname
                  });
                },
                width: "100%",
                height: "100%"
              }).embed(document.getElementById("wrap"));
            }

            // RN에서 WebView가 정상 로드되었는지 확인하기 위한 신호
            sendToRN({ __ready: true });

            // DOM 로딩 완료 후 우편번호 UI 실행
            if (document.readyState === "loading") {
              document.addEventListener("DOMContentLoaded", openPostcode);
            } else {
              openPostcode();
            }
          })();
        </script>
      </body>
      </html>
    `;
  }, []);

  /**
   * WebView → RN postMessage 수신 처리
   */
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const raw = event.nativeEvent.data;
        console.log('[WebView onMessage]', raw);

        const data = JSON.parse(raw);

        // WebView 준비 완료 신호는 무시
        if (data?.__ready) return;

        // WebView 내부 에러 처리
        if (data?.__error) {
          Alert.alert('웹뷰 로드 오류', String(data.__error));
          return;
        }

        goAddressEdit(data as AddressPayload);
      } catch (e) {
        Alert.alert('오류', '주소 정보를 불러오지 못했습니다.(onMessage)');
      }
    },
    [goAddressEdit]
  );

  /**
   * postMessage가 막힌 환경에서 커스텀 스킴을 가로채는 fallback 처리
   */
  const handleRequest = useCallback(
    (req: any) => {
      const url: string = req?.url ?? '';

      if (url.startsWith('kimsrecipe://address')) {
        try {
          console.log('[WebView intercepted url]', url);

          const match = url.match(/data=([^&]+)/);
          if (match?.[1]) {
            const payload = JSON.parse(decodeURIComponent(match[1]));

            if (payload?.__ready) return false;

            if (payload?.__error) {
              Alert.alert('웹뷰 로드 오류', String(payload.__error));
              return false;
            }

            goAddressEdit(payload);
          }
        } catch (e) {
          Alert.alert('오류', '주소 정보를 불러오지 못했습니다.(scheme)');
        }

        // WebView 내부 네비게이션 차단
        return false;
      }

      return true;
    },
    [goAddressEdit]
  );

  return (
    <SafeAreaView style={s.container}>
      <WebView
        source={{
          html,
          // about:blank 기준 외부 스크립트 로딩 이슈 방지용 baseUrl
          baseUrl: 'https://postcode.map.daum.net/',
        }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleRequest}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onError={(e) => console.log('[WebView onError]', e.nativeEvent)}
        onHttpError={(e) => console.log('[WebView onHttpError]', e.nativeEvent)}
        style={s.webview}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: moderateScale(12)
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});