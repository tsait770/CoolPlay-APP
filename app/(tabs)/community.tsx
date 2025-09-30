import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Linking,
  Platform,
  Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Share2, 
  Copy, 
  TrendingUp
} from "lucide-react-native";
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import TelegramIcon from '@/components/TelegramIcon';
import * as Clipboard from 'expo-clipboard';
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import { useReferral } from "@/providers/ReferralProvider";
import { Notification, notify } from "@/components/Notification";

interface SocialPlatform {
  id: string;
  name: string;
  iconName: string;
  iconType: 'fa5' | 'fa6' | 'custom';
  color: string;
  shareUrl: string;
  backgroundColor?: string;
  iconColor?: string;
}

interface StatData {
  id: string;
  value: number;
  label: string;
  color: string;
}

interface ChartPoint {
  x: number;
  y: number;
  color: string;
  id: string;
}

export default function CommunityScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  
  // Get referral context - hooks must always be called
  const referralContext = useReferral();
  
  // Notification state
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });
  
  // Setup notification manager
  useEffect(() => {
    notify.setShowCallback((message, type) => {
      setNotification({ visible: true, message, type });
    });
  }, []);
  
  // Use referral code from context or fallback
  const referralCode = referralContext?.userData?.referralCode || 'QUDB011W';
  const [totalReferrals, setTotalReferrals] = useState(1247);
  const [activeReferrals, setActiveReferrals] = useState(89);
  const [conversionRate, setConversionRate] = useState(23);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [platformClicks, setPlatformClicks] = useState<Record<string, number>>({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const chartAnimations = useRef<Animated.Value[]>([]).current;
  const pulseAnimations = useRef<Animated.Value[]>([]).current;
  const glowAnimations = useRef<Animated.Value[]>([]).current;
  const numberAnimations = useRef({
    referrals: new Animated.Value(0),
    active: new Animated.Value(0),
    rate: new Animated.Value(0)
  }).current;
  const floatAnimations = useRef({
    referrals: new Animated.Value(50),
    active: new Animated.Value(50),
    rate: new Animated.Value(50)
  }).current;
  const opacityAnimations = useRef({
    referrals: new Animated.Value(0),
    active: new Animated.Value(0),
    rate: new Animated.Value(0)
  }).current;

  // Social platforms with Font Awesome icons - matching reference image exactly
  const socialPlatforms: SocialPlatform[] = [
    { id: 'facebook', name: 'Facebook', iconName: 'facebook', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.facebook.com/sharer/sharer.php?u=' },
    { id: 'youtube', name: 'YouTube', iconName: 'youtube', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.youtube.com/' },
    { id: 'threads', name: 'Threads', iconName: 'threads', iconType: 'fa6', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.threads.net/' },
    { id: 'instagram', name: 'Instagram', iconName: 'instagram', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.instagram.com/' },
    { id: 'tiktok', name: 'TikTok', iconName: 'tiktok', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.tiktok.com/' },
    { id: 'telegram', name: 'Telegram', iconName: 'telegram', iconType: 'custom', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://t.me/share/url?url=' },
    { id: 'snapchat', name: 'Snapchat', iconName: 'snapchat', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.snapchat.com/' },
    { id: 'twitter', name: 'X', iconName: 'x-twitter', iconType: 'fa6', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://twitter.com/intent/tweet?text=' },
    { id: 'pinterest', name: 'Pinterest', iconName: 'pinterest', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://pinterest.com/pin/create/button/?url=' },
    { id: 'reddit', name: 'Reddit', iconName: 'reddit', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.reddit.com/submit?url=' },
    { id: 'linkedin', name: 'LinkedIn', iconName: 'linkedin', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=' },
    { id: 'whatsapp', name: 'WhatsApp', iconName: 'whatsapp', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://api.whatsapp.com/send?text=' },
    { id: 'wechat', name: 'WeChat', iconName: 'weixin', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.wechat.com/' },
    { id: 'line', name: 'LINE', iconName: 'line', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://social-plugins.line.me/lineit/share?url=' },
    { id: 'viber', name: 'Viber', iconName: 'viber', iconType: 'fa5', color: 'rgba(36, 48, 65, 0.9)', iconColor: '#FFFFFF', shareUrl: 'https://www.viber.com/' },
  ];

  const statsData: StatData[] = [
    { id: 'total', value: totalReferrals, label: t('total_referrals'), color: '#FFD166' },
    { id: 'active', value: activeReferrals, label: t('active_referrals'), color: '#6EF9A9' },
    { id: 'rate', value: conversionRate, label: t('conversion_rate'), color: '#6CD4FF' },
  ];

  useEffect(() => {
    // Initialize chart data with pattern matching HTML version
    const initialData: ChartPoint[] = [];
    // Pattern from HTML: [1, 2, 2, 3, 4, 5] points per column
    const columnHeights = [1, 2, 2, 3, 4, 5];
    
    for (let col = 0; col < 6; col++) {
      const pointCount = columnHeights[col];
      for (let point = 0; point < pointCount; point++) {
        // Alternate colors to match HTML pattern
        const isYellow = (col + point) % 2 === 0;
        initialData.push({
          x: col,
          y: point,
          color: isYellow ? '#FFD166' : '#6EF9A9',
          id: `${col}-${point}`
        });
      }
    }
    setChartData(initialData);

    // Initialize chart animations
    chartAnimations.length = 0;
    pulseAnimations.length = 0;
    glowAnimations.length = 0;
    initialData.forEach(() => {
      chartAnimations.push(new Animated.Value(0));
      pulseAnimations.push(new Animated.Value(1));
      glowAnimations.push(new Animated.Value(0.3));
    });

    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate chart points with stagger and pulse
    setTimeout(() => {
      chartAnimations.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 50),
          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          })
        ]).start();
        
        // Start pulse animation
        if (pulseAnimations[index]) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnimations[index], {
                toValue: 1.3,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnimations[index], {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              })
            ])
          ).start();
        }
        
        // Start glow animation
        if (glowAnimations[index]) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnimations[index], {
                toValue: 0.6,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(glowAnimations[index], {
                toValue: 0.2,
                duration: 2000,
                useNativeDriver: true,
              })
            ])
          ).start();
        }
      });
    }, 500);

    // Animate numbers with float effect
    setTimeout(() => {
      // Float up animation for referrals
      Animated.parallel([
        Animated.spring(floatAnimations.referrals, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimations.referrals, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(numberAnimations.referrals, {
          toValue: totalReferrals,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start();
      
      // Float up animation for active referrals with delay
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(floatAnimations.active, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimations.active, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(numberAnimations.active, {
            toValue: activeReferrals,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]).start();
      }, 300);
      
      // Float up animation for conversion rate with delay
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(floatAnimations.rate, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimations.rate, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(numberAnimations.rate, {
            toValue: conversionRate,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]).start();
      }, 600);
    }, 1000);


  }, []);

  const getLocalizedShareText = useCallback(() => {
    const texts: { [key: string]: string } = {
      'en': `🎬🌟 The ultimate voice-controlled video player is here!

Want to free your hands?
Try this video voice player!
Fast forward, pause, play - all with just one sentence 🎙️

🎁 Get 2000 free voice credits when you sign up
Enter my referral code to get an extra 300 credit bonus 🎫

👉 Referral code: ${referralCode}`,
      
      'zh-TW': `語音操控影片的神器來了 🎬🌟

想要解放雙手？
試試這款影片語音播放器！
快轉、暫停、播放，全靠一句話 🎙️

🎁 登入即可獲得 2000 次免費語音積分
再輸入我的推薦碼，額外領取 300 次積分獎勵 🎫

👉 推薦碼：${referralCode}`,
      
      'zh-CN': `语音操控影片的神器来了 🎬🌟

想要解放双手？
试试这款影片语音播放器！
快转、暂停、播放，全靠一句话 🎙️

🎁 登录即可获得 2000 次免费语音积分
再输入我的推荐码，额外领取 300 次积分奖励 🎫

👉 推荐码：${referralCode}`,
      
      'ja': `音声操作動画の神器が登場 🎬🌟

手を解放したい？
この動画音声プレーヤーを試してみてください！
早送り、一時停止、再生、すべて一言で 🎙️

🎁 ログインするだけで2000回分の無料音声クレジットを獲得
私の紹介コードを入力して、さらに300回分のボーナスクレジットを獲得 🎫

👉 紹介コード：${referralCode}`,
      
      'es': `La herramienta definitiva para controlar videos por voz está aquí 🎬🌟

¿Quieres liberar tus manos?
¡Prueba este reproductor de video por voz!
Avance rápido, pausa, reproducción, todo con una sola frase 🎙️

🎁 Obtén 2000 créditos de voz gratis al registrarte
Ingresa mi código de referencia para obtener 300 créditos adicionales 🎫

👉 Código de referencia: ${referralCode}`,
      
      'pt-BR': `A ferramenta definitiva para controlar vídeos por voz está aqui 🎬🌟

Quer liberar suas mãos?
Experimente este player de vídeo por voz!
Avanço rápido, pausa, reprodução, tudo com uma única frase 🎙️

🎁 Obtenha 2000 créditos de voz gratuitos ao se inscrever
Digite meu código de indicação para obter 300 créditos extras 🎫

👉 Código de indicação: ${referralCode}`,
      
      'ko': `음성으로 동영상을 제어하는 최고의 도구가 여기 있습니다 🎬🌟

손을 자유롭게 하고 싶으신가요?
이 음성 동영상 플레이어를 시도해보세요!
빨리감기, 일시정지, 재생, 모두 한 마디로 🎙️

🎁 가입하면 2000회 무료 음성 크레딧 획득
내 추천 코드를 입력하고 300회 추가 보너스 크레딧 받기 🎫

👉 추천 코드: ${referralCode}`,
      
      'de': `Das ultimative sprachgesteuerte Video-Tool ist hier 🎬🌟

Möchten Sie Ihre Hände frei haben?
Probieren Sie diesen Sprach-Videoplayer aus!
Vorspulen, Pause, Wiedergabe - alles mit nur einem Satz 🎙️

🎁 Erhalten Sie 2000 kostenlose Sprachguthaben bei der Anmeldung
Geben Sie meinen Empfehlungscode ein, um 300 zusätzliche Credits zu erhalten 🎫

👉 Empfehlungscode: ${referralCode}`,
      
      'fr': `L'outil ultime pour contrôler les vidéos par la voix est là 🎬🌟

Envie de libérer vos mains ?
Essayez ce lecteur vidéo vocal !
Avance rapide, pause, lecture - tout avec une seule phrase 🎙️

🎁 Obtenez 2000 crédits vocaux gratuits à l'inscription
Entrez mon code de parrainage pour obtenir 300 crédits bonus 🎫

👉 Code de parrainage : ${referralCode}`,
      
      'ru': `Идеальный инструмент для голосового управления видео здесь 🎬🌟

Хотите освободить руки?
Попробуйте этот голосовой видеоплеер!
Перемотка, пауза, воспроизведение - всё одной фразой 🎙️

🎁 Получите 2000 бесплатных голосовых кредитов при регистрации
Введите мой реферальный код для получения 300 бонусных кредитов 🎫

👉 Реферальный код: ${referralCode}`,
      
      'ar': `أداة التحكم الصوتي في الفيديو المثالية هنا 🎬🌟

تريد تحرير يديك؟
جرب مشغل الفيديو الصوتي هذا!
التقديم السريع، الإيقاف المؤقت، التشغيل - كل شيء بجملة واحدة 🎙️

🎁 احصل على 2000 رصيد صوتي مجاني عند التسجيل
أدخل رمز الإحالة الخاص بي للحصول على 300 رصيد إضافي 🎫

👉 رمز الإحالة: ${referralCode}`,
      
      'pt': `A ferramenta definitiva para controlar vídeos por voz está aqui 🎬🌟

Quer libertar as suas mãos?
Experimente este reprodutor de vídeo por voz!
Avanço rápido, pausa, reprodução, tudo com uma única frase 🎙️

🎁 Obtenha 2000 créditos de voz gratuitos ao inscrever-se
Digite o meu código de referência para obter 300 créditos extras 🎫

👉 Código de referência: ${referralCode}`
    };
    
    return texts[language] || texts['en'];
  }, [referralCode, language]);

  const copyReferralCode = useCallback(async () => {
    try {
      const shareText = getLocalizedShareText();
      await Clipboard.setStringAsync(shareText);
      
      // Record the action if referral context is available
      if (referralContext?.recordReferralAction) {
        referralContext.recordReferralAction('copy');
      }
      
      notify.success(t('copied_to_clipboard'));
    } catch (error) {
      console.error('Copy failed:', error);
      notify.error(t('copy_failed'));
    }
  }, [getLocalizedShareText, t, referralContext]);

  const shareReferralCode = useCallback(async () => {
    try {
      const shareText = getLocalizedShareText();
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareText);
        
        // Record the action if referral context is available
        if (referralContext?.recordReferralAction) {
          referralContext.recordReferralAction('share');
        }
        
        notify.success(t('copied_to_clipboard'));
      } else {
        copyReferralCode();
      }
    } catch (error) {
      console.error('Share failed:', error);
      notify.error(t('share_failed'));
    }
  }, [getLocalizedShareText, t, copyReferralCode, referralContext]);

  const addDataPoint = useCallback(() => {
    // Find a random column to add point to
    const col = Math.floor(Math.random() * 6);
    const existingPoints = chartData.filter(p => p.x === col);
    const newY = existingPoints.length;
    
    if (newY < 5) { // Max 5 points per column
      const newPoint: ChartPoint = {
        x: col,
        y: newY,
        color: Math.random() > 0.5 ? '#FFD166' : '#6EF9A9',
        id: `${col}-${newY}-${Date.now()}`
      };
      
      setChartData(prev => [...prev, newPoint]);
      
      // Animate new point with pulse and glow
      const newAnim = new Animated.Value(0);
      const newPulse = new Animated.Value(1);
      const newGlow = new Animated.Value(0.3);
      chartAnimations.push(newAnim);
      pulseAnimations.push(newPulse);
      glowAnimations.push(newGlow);
      
      Animated.spring(newAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      // Start pulse animation for new point
      Animated.loop(
        Animated.sequence([
          Animated.timing(newPulse, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(newPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      ).start();
      
      // Start glow animation for new point
      Animated.loop(
        Animated.sequence([
          Animated.timing(newGlow, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(newGlow, {
            toValue: 0.2,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
    
    // Update stats
    setTotalReferrals(prev => prev + Math.floor(Math.random() * 50) + 10);
    setActiveReferrals(prev => prev + Math.floor(Math.random() * 10) + 1);
    setConversionRate(prev => Math.min(prev + Math.floor(Math.random() * 5) + 1, 100));
  }, [chartData, chartAnimations, pulseAnimations, glowAnimations]);

  const sharePlatform = useCallback((platform: SocialPlatform) => {
    if (!platform?.id || !platform?.shareUrl) {
      console.log('Invalid platform data');
      return;
    }
    
    // Record the action if referral context is available
    if (referralContext?.recordReferralAction) {
      referralContext.recordReferralAction(platform.id);
    }
    
    // Track platform clicks
    const newClicks = { ...platformClicks };
    const isFirstClick = !newClicks[platform.id];
    newClicks[platform.id] = (newClicks[platform.id] || 0) + 1;
    setPlatformClicks(newClicks);

    // Update statistics when user clicks (simulating real tracking)
    if (isFirstClick) {
      // Immediately increase total referrals (user shared)
      const newTotalReferrals = totalReferrals + 1;
      setTotalReferrals(newTotalReferrals);
      
      // Animate the number change with float effect
      Animated.sequence([
        Animated.timing(floatAnimations.referrals, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimations.referrals, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Simulate conversion (someone used the referral code)
      setTimeout(() => {
        if (Math.random() > 0.3) { // 70% conversion rate simulation
          const newActiveReferrals = activeReferrals + 1;
          setActiveReferrals(newActiveReferrals);
          
          // Animate active referrals
          Animated.sequence([
            Animated.timing(floatAnimations.active, {
              toValue: 10,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnimations.active, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start();
          
          // Update conversion rate
          const newRate = Math.round((newActiveReferrals / newTotalReferrals) * 100);
          setConversionRate(newRate);
          
          // Animate conversion rate
          Animated.sequence([
            Animated.timing(floatAnimations.rate, {
              toValue: 10,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnimations.rate, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start();
        }
      }, 2000); // Simulate delay for conversion
      
      // Add a new data point to chart with animation
      addDataPoint();
    }
    
    const shareText = encodeURIComponent(getLocalizedShareText());
    const appUrl = encodeURIComponent('https://coolplay.app');
    
    let url = '';
    switch (platform.id) {
      case 'whatsapp':
        url = `${platform.shareUrl}${shareText}`;
        break;
      case 'twitter':
        url = `${platform.shareUrl}${shareText}&url=${appUrl}`;
        break;
      case 'telegram':
      case 'line':
        url = `${platform.shareUrl}${appUrl}&text=${shareText}`;
        break;
      default:
        url = `${platform.shareUrl}${appUrl}`;
        break;
    }

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        notify.error(t('platform_not_available'));
      });
    }
  }, [getLocalizedShareText, t, platformClicks, activeReferrals, totalReferrals, floatAnimations, addDataPoint]);

  const resetChart = useCallback(() => {
    // Fade out existing points
    const validAnimations = chartAnimations.filter(anim => anim);
    Animated.parallel(
      validAnimations.map(anim => 
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      )
    ).start(() => {
      // Reset data with consistent pattern
      const initialData: ChartPoint[] = [];
      const columnHeights = [2, 3, 4, 3, 5, 3]; // Consistent pattern
      
      for (let col = 0; col < 6; col++) {
        const pointCount = columnHeights[col];
        for (let point = 0; point < pointCount; point++) {
          initialData.push({
            x: col,
            y: point,
            color: Math.random() > 0.5 ? '#FFD166' : '#6EF9A9',
            id: `${col}-${point}`
          });
        }
      }
      setChartData(initialData);
      setTotalReferrals(1247);
      setActiveReferrals(89);
      setConversionRate(23);
      setPlatformClicks({});

      // Reset animations
      chartAnimations.length = 0;
      initialData.forEach(() => {
        chartAnimations.push(new Animated.Value(0));
      });

      // Animate new points
      setTimeout(() => {
        chartAnimations.forEach((anim, index) => {
          if (anim) {
            Animated.sequence([
              Animated.delay(index * 50),
              Animated.spring(anim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
              })
            ]).start();
          }
        });
      }, 100);
    });
  }, [chartAnimations]);

  const renderSocialPlatform = (platform: SocialPlatform) => {
    const iconColor = platform.iconColor || '#FFFFFF';
    const iconSize = Platform.select({ 
      web: isDesktop ? 26 : isTablet ? 24 : 22,
      default: isTablet ? 26 : 24
    });
    
    return (
      <TouchableOpacity
        key={platform.id}
        style={[
          styles.socialButton,
          { backgroundColor: platform.color }
        ]}
        onPress={() => sharePlatform(platform)}
        activeOpacity={0.7}
      >
        {platform.iconType === 'custom' && platform.id === 'telegram' ? (
          <TelegramIcon size={iconSize} color={iconColor} />
        ) : (
          (() => {
            const IconComponent = platform.iconType === 'fa6' ? FontAwesome6 : FontAwesome5;
            return (
              <IconComponent 
                name={platform.iconName as any} 
                size={iconSize} 
                color={iconColor}
              />
            );
          })()
        )}
        <Text style={styles.socialLabel}>{platform.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderChartPoint = (point: ChartPoint, index: number) => {
    const animValue = chartAnimations[index] || new Animated.Value(0);
    const pulseValue = pulseAnimations[index] || new Animated.Value(1);
    const glowValue = glowAnimations[index] || new Animated.Value(0.3);
    const columnWidth = 45;
    const pointSize = 12; // Smaller size for better visual
    const spacing = 5; // Adjusted spacing
    
    return (
      <Animated.View
        key={point.id}
        style={[
          styles.chartPoint,
          {
            backgroundColor: point.color,
            bottom: 15 + (point.y * (pointSize + spacing)),
            left: 10 + (point.x * columnWidth) + (columnWidth - pointSize) / 2,
            opacity: animValue,
            transform: [
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                })
              },
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }
            ],
            shadowColor: point.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 15,
          }
        ]}
      >
        {/* Pulse ring effect - outer */}
        <Animated.View 
          style={[
            styles.chartPointPulse,
            {
              backgroundColor: point.color,
              opacity: glowValue.interpolate({
                inputRange: [0.2, 0.6],
                outputRange: [0.2, 0.3],
              }),
              transform: [{ scale: pulseValue }]
            }
          ]}
        />
        {/* Flash effect */}
        <Animated.View 
          style={[
            styles.chartPointFlash,
            {
              backgroundColor: '#FFFFFF',
              opacity: glowValue.interpolate({
                inputRange: [0.2, 0.6],
                outputRange: [0, 0.4],
              }),
            }
          ]}
        />
      </Animated.View>
    );
  };

  const styles = getStyles(screenWidth);
  
  return (
    <>
      <Notification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View 
        style={[
          styles.content, 
          { 
            paddingTop: 16 + insets.top,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Share2 size={28} color={Colors.primary.accent} />
            <Text style={styles.title}>{t('social_share')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('share_description')}</Text>
        </View>

        {/* Social Platforms Grid */}
        <View style={styles.socialGrid}>
          {socialPlatforms.map(renderSocialPlatform)}
        </View>

        {/* Referral Code Card */}
        <View style={styles.referralCard}>

          <Text style={styles.referralTitle}>{t('referral_code_title')}</Text>
          <Text style={styles.referralCode}>{referralCode}</Text>
          
          <View style={styles.referralActions}>
            <TouchableOpacity style={styles.referralButton} onPress={copyReferralCode}>
              <Copy size={18} color={Colors.primary.text} />
              <Text style={styles.referralButtonText}>{t('copy_code')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.referralButton, styles.shareButton]} 
              onPress={shareReferralCode}
            >
              <Share2 size={18} color={Colors.primary.text} />
              <Text style={styles.referralButtonText}>{t('share_code')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rewardInfo}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardNumber}>+300</Text>
              <Text style={styles.rewardLabel}>{t('inviter_reward')}</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardNumber}>+300</Text>
              <Text style={styles.rewardLabel}>{t('invitee_reward')}</Text>
            </View>
          </View>
        </View>

        {/* Statistics Chart */}
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <TrendingUp size={24} color={Colors.primary.accent} />
            <Text style={styles.statsTitle}>{t('referral_stats')}</Text>
          </View>

          <View style={styles.chartContainer}>
            <View style={styles.chartGrid}>
              {Array.from({ length: 30 }, (_, i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
            <View style={styles.chart}>
              {chartData.map(renderChartPoint)}
            </View>
          </View>

          <View style={styles.statsNumbers}>
            {statsData.map((stat) => {
              const floatAnim = stat.id === 'total' ? floatAnimations.referrals : 
                               stat.id === 'active' ? floatAnimations.active : 
                               floatAnimations.rate;
              const opacityAnim = stat.id === 'total' ? opacityAnimations.referrals : 
                                  stat.id === 'active' ? opacityAnimations.active : 
                                  opacityAnimations.rate;
              
              return (
                <Animated.View 
                  key={stat.id} 
                  style={[
                    styles.statItem,
                    {
                      opacity: opacityAnim,
                      transform: [{ translateY: floatAnim }]
                    }
                  ]}
                >
                  <Animated.Text style={[styles.statNumber, { color: stat.color }]}>
                    {stat.id === 'rate' ? `+${stat.value}%` : stat.value}
                  </Animated.Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Share Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{t('share_tips')}</Text>
          <View style={styles.tipsList}>
            {[
              t('share_tip_1'),
              t('share_tip_2'),
              t('share_tip_3'),
              t('share_tip_4'),
              t('share_tip_5')
            ].map((tip, tipIndex) => (
              <View key={`tip-${tipIndex}`} style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>




      </Animated.View>
    </ScrollView>
    </>
  );
}

const getStyles = (screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2A38',
  },
  content: {
    padding: Platform.select({
      web: screenWidth >= 1024 ? 32 : screenWidth >= 768 ? 24 : 16,
      default: screenWidth >= 768 ? 24 : 16
    }),
    paddingBottom: 100,
    maxWidth: Platform.select({
      web: 1200,
      ios: '100%' as any,
      android: '100%' as any
    }) as any,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: Platform.select({
      web: screenWidth >= 768 ? 36 : 28,
      default: screenWidth >= 768 ? 36 : 28
    }),
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginLeft: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    lineHeight: 24,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 8,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: Platform.select({ 
      web: screenWidth >= 1024 ? 16 : screenWidth >= 768 ? 14 : 12,
      default: 12 
    }),
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  socialButton: {
    width: Platform.select({
      web: screenWidth >= 1024 ? '14%' : screenWidth >= 768 ? '22%' : '30%',
      default: screenWidth >= 768 ? '22%' : '30%'
    }),
    minWidth: Platform.select({
      web: 90,
      default: 85
    }),
    aspectRatio: Platform.select({
      web: screenWidth >= 768 ? 1.1 : 1.3,
      default: 1.3
    }),
    borderRadius: 16,
    padding: Platform.select({
      web: screenWidth >= 768 ? 16 : 14,
      default: 16
    }),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 212, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  socialLabel: {
    fontSize: Platform.select({
      web: screenWidth >= 768 ? 13 : 12,
      default: 13
    }),
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Montserrat',
    marginTop: Platform.select({
      web: 8,
      default: 10
    }),
    fontWeight: '500' as const,
  },
  referralCard: {
    backgroundColor: 'rgba(36, 48, 65, 0.8)',
    borderRadius: 16,
    padding: Platform.select({
      web: screenWidth >= 768 ? 32 : 24,
      default: screenWidth >= 768 ? 32 : 24
    }),
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(108, 212, 255, 0.3)',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#6CD4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },

  referralTitle: {
    fontSize: Platform.select({
      web: screenWidth >= 768 ? 24 : 20,
      default: screenWidth >= 768 ? 24 : 20
    }),
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 24,
    fontFamily: 'Montserrat',
  },
  referralCode: {
    fontSize: Platform.select({
      web: screenWidth >= 768 ? 29 : 24,
      default: screenWidth >= 768 ? 29 : 24
    }),
    fontWeight: '800' as const,
    color: '#FFD166',
    letterSpacing: 3,
    marginBottom: 24,
    fontFamily: 'Montserrat',
    textShadowColor: 'rgba(255, 209, 102, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  referralActions: {
    flexDirection: Platform.select({
      web: 'row',
      default: screenWidth >= 400 ? 'row' : 'column'
    }),
    gap: 12,
    marginBottom: 20,
    width: Platform.select({
      web: 'auto',
      default: screenWidth < 400 ? '100%' : 'auto'
    }),
  },
  referralButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6CD4FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  shareButton: {
    backgroundColor: 'rgba(30, 42, 56, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(108, 212, 255, 0.3)',
  },
  referralButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  rewardInfo: {
    flexDirection: 'row',
    gap: 48,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#6CD4FF',
    fontFamily: 'Montserrat',
  },
  rewardLabel: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  statsContainer: {
    backgroundColor: 'rgba(36, 48, 65, 0.8)',
    borderRadius: 20,
    padding: Platform.select({
      web: screenWidth >= 768 ? 32 : 24,
      default: screenWidth >= 768 ? 32 : 24
    }),
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(108, 212, 255, 0.3)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#6CD4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginLeft: 12,
    fontFamily: 'Montserrat',
  },
  chartContainer: {
    height: Platform.select({
      web: screenWidth >= 768 ? 300 : 250,
      default: screenWidth >= 768 ? 300 : 250
    }),
    marginBottom: 32,
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
  },
  chartGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridLine: {
    width: '16.66%',
    height: '20%',
    borderWidth: 0.5,
    borderColor: 'rgba(176, 190, 197, 0.1)',
  },
  chart: {
    position: 'relative',
    flex: 1,
  },
  chartPoint: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  chartPointPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    top: -7.5,
    left: -7.5,
  },
  chartPointGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  chartPointFlash: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 3.5,
    left: 3.5,
  },
  statsNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800' as const,
    fontFamily: 'Montserrat',
  },
  statLabel: {
    fontSize: 15,
    color: '#B0BEC5',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },

  tipsContainer: {
    backgroundColor: 'rgba(30, 42, 56, 0.4)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 212, 255, 0.3)',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Montserrat',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6CD4FF',
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    fontFamily: 'Montserrat',
  },

});