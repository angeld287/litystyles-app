import React, {useEffect, useState, useCallback} from 'react';
import { Image, Linking, Platform, Alert, ActivityIndicator, View, Modal, StyleSheet, Text } from "react-native";
import { AppLoading } from "expo";
import { useFonts } from '@use-expo/font';
import { Asset } from "expo-asset";
import { Block, GalioProvider } from "galio-framework";
import { NavigationContainer } from "@react-navigation/native";
import { API, graphqlOperation } from 'aws-amplify';

import { createCustomer, updateCustomer } from './graphql/mutations';
import { listCustomers } from './graphql/queries';

import firebase from 'react-native-firebase';

import GLOBAL from './global';

import Amplify, { Auth } from 'aws-amplify';
import awsconfig from './aws-exports';
import { ConfirmSignIn, ConfirmSignUp, ForgotPassword, RequireNewPassword, SignUp, VerifyContact, withAuthenticator } from 'aws-amplify-react-native';
import { notificationManager } from './NotificationManager';

// Before rendering any navigation stack
import { enableScreens } from "react-native-screens";
enableScreens();

import Screens from "./navigation/Screens";
import { Images, articles, argonTheme } from "./constants";
import MySignIn from './components/Auth/MySignIn';

import InAppbrowser from 'react-native-inappbrowser-reborn'

async function urlOpener(url, redirectUrl){
  await InAppbrowser.isAvailable();
  const {type, url: newUrl} = await InAppbrowser.openAuth(url, redirectUrl,
  {
    showTitle: false,
    enableUrlBarHiding: true,
    enableDefaultShare: false,
    ephemeralWebSession: false,
  })

  if (type==="success") {
    Linking.openURL(newUrl)
  }
}

Amplify.configure({
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    urlOpener,
  },
  Analytics: {
    disabled: true,
  },
});


// cache app images
const assetImages = [
  Images.Onboarding,
  Images.LogoOnboarding,
  Images.Logo,
  Images.Pro,
  Images.ArgonLogo,
  Images.iOSLogo,
  Images.androidLogo
];

// cache product images
articles.map(article => assetImages.push(article.image));

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === "string") {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

const sendLocalNotification = () => {

  notificationManager.showNotification(
    1,
    "App Notification",
    "Esto es una prueba de notificacion",
    {},
    {}
  );
  
}

const sendNotifications = (object) => {
  fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json',
          'Authorization': 'key=AIzaSyBnmavsrltI_zvcP8kmZVpwr8fS0e95fQY'
          },
          body: JSON.stringify({
                  to: object.to,
                  notification: {
                      title: object.title,
                      body: object.message,
                      sound: 'default',
                  },
                  data: {
                      consult_id: object.consultation_id,
                  }
              })
      }).then((r) => r.json()).then().catch((err) => { // Error response
          console.log(err);
      });
  
}

const Home = props => {

  const { roles, username, attributes, userdb } = props.authData;

  const [_roles, setRoles ] = useState(roles);
  const [modalVisible, setModalVisible] = useState(false);


  const addUserToGroup = useCallback( 
    async (username) => {
      try {
        const apiOptions = {};

        apiOptions['headers'] = {
            'Content-Type': 'application/json'
        };
        
        apiOptions['body'] = {
          GroupName: 'customer',
          UserPoolId: awsconfig.aws_user_pools_id,
          Username: username
        };

        await API.post('apiForLambda', '/addUserToGroup', apiOptions);

        return true;

      } catch (e) {

        console.log(e);

        return false;
      }
    },
    []
  );

  const appStart = useCallback(
    async () => {
      try {
        var _r = roles;

        const hasOnlyGoogleRole = _r !== undefined && _r.length === 1 && _r[0].toUpperCase().includes("GOOGLE");

        if (hasOnlyGoogleRole) {
          
          var added = userdb === null ? await addUserToGroup(username) : true; 

          if (added) {
            
            _r.push('customer');
            
            setRoles(_r);

            const _input = {
              username: username,
              //phoneid: GLOBAL.PHONE_TOKEN,
              name: attributes.name
            }

            const cuser = userdb === null ? await API.graphql(graphqlOperation(createCustomer, {input: _input})) : null;

            //cierre de sesion para que se refleje el nuevo rol agregado
            setModalVisible(true);
            sleep(6000).then(async () => {
                setModalVisible(false)
                await Auth.signOut({ global: true });
            });
          }
        }
      } catch (e) {
        console.log(e);
      }
    },
    [addUserToGroup]
  );

  useEffect(() => { 
    notificationManager.configure(onRegister, onNotification, onOpenNotification); 
    appStart();

  }, [notificationManager, appStart]);
  
  const onRegister = (token) => {
    GLOBAL.PHONE_TOKEN = token.token;
    if(userdb !== null && userdb.phoneid !== token.token){
      API.graphql(graphqlOperation(updateCustomer, {input: {id: userdb.id, phoneid: token.token}})).catch(_ => console.log("ha ocurrido un error al actualizar el phoneid del usuario"));
    }
  }

  const onNotification = (notification) => {
    //console.log("[Notification] onNotification: ", notification);
    notificationManager.showNotification(notification.id, notification.title, notification.message, notification.data = {} , {});
  }

  const onOpenNotification = (notify) => {
    //console.log("[Notification] onOpenNotification: ", notify);
    alert("");
  }

  const [isLoadingComplete, setLoading] = useState(false);
  let [fontsLoaded] = useFonts({
    'ArgonExtra': require('./assets/font/argon.ttf'),
  });

  function _loadResourcesAsync() {
    return Promise.all([...cacheImages(assetImages)]);
  }

  function _handleLoadingError(error) {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

 function _handleFinishLoading() {
    setLoading(true);
  };

  if(!fontsLoaded && !isLoadingComplete) {
    return (
      <AppLoading
        startAsync={_loadResourcesAsync}
        onError={_handleLoadingError}
        onFinish={_handleFinishLoading}
      />
    );
  } else if(fontsLoaded) {

    props.authData.roles = _roles;

    return (
      <NavigationContainer>
        <GalioProvider theme={argonTheme}>
          <Block flex>
            <Screens {...props} SLN={sendLocalNotification}/>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text style={{marginBottom: 3, fontSize: 16}}>Cierre de Sesion Programado</Text>
                  <Text style={styles.modalText}>En unos segundos procederemos a cerrar la sesion para que se terminen de completar algunas configuracion. Favor iniciar sesion nuevamente.</Text>
                </View>
              </View>
            </Modal>
          </Block>
        </GalioProvider>
      </NavigationContainer>
    );
  } else {
    return null
  }
}

// sleep time expects milliseconds
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const AuthScreens = (props) => {
  const [loaging , setLoading] = useState(true);
  
  props.authData.roles = props.authData.signInUserSession.accessToken.payload['cognito:groups'];
  API.graphql(graphqlOperation(listCustomers, {limit: 400, filter: { username: {eq: props.authData.username}}}))
  .then(r => {
    props.authData.userdb = r.data.listCustomers.items.length !== 0 ? r.data.listCustomers.items[0] : null;
    if(props.authData.attributes === undefined){
      Auth.currentAuthenticatedUser().then(r => {
        props.authData.attributes = r.attributes;
        setLoading(false);
      })
      .catch(e => {
        setLoading(false);
        console.log(e);
      });
    }else{
      sleep(1000).then(() => {
          setLoading(false)
      });
    }
  })
  .catch(e => {
    setLoading(false);
    console.log(e);
  });
  

  return loaging ? <View style={{marginTop: 40}}><ActivityIndicator size="large" color="#0000ff" /></View> :  <Home {...props}/>
};

export default withAuthenticator(AuthScreens, false, [
  <MySignIn/>,
  <ConfirmSignIn/>,
  <VerifyContact/>,
  <SignUp/>,
  <ConfirmSignUp/>,
  <ForgotPassword/>,
  <RequireNewPassword />
]);

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  openButton: {
    backgroundColor: "#F194FF",
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  }
});