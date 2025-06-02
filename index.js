if (typeof global.ErrorUtils !== 'object') {
    global.ErrorUtils = {
      setGlobalHandler: (error, isFatal) => {
        // İstersen bu kısma hata loglama koyabilirsin.
        console.log('[Dummy ErrorUtils] Yakalanan hata:', error, 'Fatal mı?', isFatal);
      },
    };
  }
  
  import { AppRegistry } from 'react-native';
  import App from './App';
  import { name as appName } from './app.json';
  
  AppRegistry.registerComponent(appName, () => App);
  