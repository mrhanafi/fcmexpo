import { useEffect, useRef, useState } from 'react';
import { Button, Platform, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    console.log('Registering for push notifications...')
    registerForPushNotificationsAsync().then(token => {
      console.log("tokeny:", token);
      setExpoPushToken(token)
    })
    .catch((err) => console.log(err));

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };


  },[])

  async function registerForPushNotificationsAsync() {
    let token;
  
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        ToastAndroid.show('Failed to get push token for push notification!',ToastAndroid.LONG)
        return;
      }
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      // EAS projectId is used here.
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log(token);
      } catch (e) {
        token = `${e}`;
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }
  
    return token;
  }

  const sendNotification = async (expoPushToken) => {
    console.log("Sending Push notification...")
    ToastAndroid.show('Sending Push Notification...',ToastAndroid.SHORT)
    
    const message = {
      to: expoPushToken,
      sound: "default",
      title: "My firsth push notification",
      body: "This is the first push notification thru expo",
      channelId: "default"
    }
    await fetch("https://exp.host/--/api/v2/push/send?useFcmV1=true",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "accept-encoding": "gzip, deflate",
        "content-type": "application/json",
      },
      body:JSON.stringify(message),
    })
    // .then(res => {
    //   ToastAndroid.show(res.data.status,ToastAndroid.SHORT)
    // })
    // .catch((err) => ToastAndroid.show(err.data.detail.error,ToastAndroid.SHORT));
  }
  
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      <Text>Your Expo push token:</Text>
      <Text>{expoPushToken}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendNotification(expoPushToken);
        }}
      />
    </View>
    // <View style={{ marginTop: 100,alignItems:'center' }}>
    //   <Text style={{ marginVertical:30 }}>Expo Push Notifications</Text>
    //   <Button title='Send Push Notification' onPress={sendNotification}>Send Push Notification</Button>
    //   <Text>{expoPushToken}</Text>
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
