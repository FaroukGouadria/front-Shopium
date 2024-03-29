/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable no-undef */
/* eslint-disable prettier/prettier */
import 'react-native-gesture-handler';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ForgotPassword from './src/Screens/authScreens/ForgotPassword';
import LoginScreen from './src/Screens/authScreens/LoginScreen';
import ResetPassword from './src/Screens/authScreens/ResetPassword';
import SignUpScreen from './src/Screens/authScreens/SignUpScreen';
import Verification from './src/Screens/authScreens/Verification';
import {showMessage} from "react-native-flash-message";
import SplashScreen from './src/Screens/MainScreens/SplashScreen';
import { NavigationContainer } from '@react-navigation/native';
import React,{useState,useEffect, useReducer, useMemo} from 'react';
import OnboardingScreen from './src/Screens/authScreens/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabNavigation from './src/routes/TabNavigation/tabNavigation';
import { API_BASE_URL } from './src/config/urls';
import ProductsProvider from './src/tools/ProductContext';

import AuthContext from './src/tools/AuthContext';
import axios from 'axios';


const RootStack = createNativeStackNavigator();

const initialState = {
isLoading :true,
isLoggedIn:false,
userToken:null,
userId:null,
};
const reducer = (prevState,action)=>{
  switch (action.type){
     case 'RESTORE_TOKEN_SUCCESS':
      return {
        ...prevState,
        userToken:action.token,
        isLoading:false,
        isLoggedIn:true,
        userId:action.id,
      };
    case 'RESTORE_TOKEN_FAILURE':
      return {
        ...prevState,
        isLoading:false,
        isLoggedIn:false,
      };
      case 'SIGN_IN':
        return {
          ...prevState,
          userToken:action.token,
          isLoggedIn:true,
          userId:action.id,
        };
      case 'SIGN_OUT':
        return {
          ...prevState,
          userToken:null,
          isLoggedIn:false,
          userId:null,
        };
      case 'SIGN_UP' :
      return {
        ...prevState,
        isLoading:false,
        isLoggedIn:false,
        userId:action.id,
      };
  }
};
const App = ({route})=>{
  //dispatch
  const [state,dispatch] = useReducer(reducer,initialState);
  console.log('state',state);
    const [showSplashScreen, setShowSplashScreen] = useState(true);
    const [isFirstLaunch,setIsFirstLaunch] = useState(null);
     useEffect(() => {
    setTimeout(() => {
      setShowSplashScreen(false);
    }, 3000);
  }, [showSplashScreen]);
  useEffect(() => {
    const appData = AsyncStorage.getItem('isFirstLaunch');
    console.log(appData);
    if (appData == null) {
      setIsFirstLaunch(true);
      console.log(isFirstLaunch);
      AsyncStorage.setItem('isFirstLaunch', 'false');
    } else {
      setIsFirstLaunch(false);
    }
  }, [isFirstLaunch]);
      useEffect(()=>{
        const bootstrapAsync = async()=>{
          let userToken;
          let userId;
          try {
            userToken = await  AsyncStorage.getItem('token');
            userId = await AsyncStorage.getItem('userId');
            console.log({user:userId});
          } catch (error) {
              console.log('error',error);
              //error fetching token
          }
          if (userToken !== null)
            {dispatch({type:'RESTORE_TOKEN_SUCCESS',token:userToken,id:userId});}
          else
             {dispatch({type:'RESTORE_TOKEN_FAILURE'});}
        };
        bootstrapAsync();
      },[]);
      const authContext = useMemo(
         ()=>({
            signIn: async (email,password)=>{
               const response = await axios.post(`${API_BASE_URL}/user/signin`,{email,password});
              console.log('App singIn', response.data.user);
              if (response.data.success){
                const userInfo = response.data;
                console.log(response.data.verified);
                if (response.data.verified === false){
                      dispatch({type:'RESTORE_TOKEN_FAILURE'});
                       showMessage({type: 'danger', icon: 'danger',message: "Please Verifier Votre Compte",position:'top',backgroundColor:'red'});
                } else {
                  await AsyncStorage.setItem('token',userInfo.token);
                   await AsyncStorage.setItem('userId',userInfo.id);
                   console.log('userId',userInfo.id);
                   showMessage({type: 'danger', icon: 'danger',message: "BienVenu à Shopium",position:'top',backgroundColor:'green'});
                  dispatch({type:'SIGN_IN',token:userInfo.token, id:userInfo.id});
                }
              }
            },
            signOut: async ()=>{
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userId');
               dispatch({type:'SIGN_OUT'});
            },
            signUp: async (nom,prenom,ville,pays,email,password)=>{
              const response =  await axios.post(`${API_BASE_URL}user/create`,{nom,prenom,ville,pays,email,password});
              console.log('app sigUp',response.data);
              if (response.data.success){
                const userInfo = response.data.user;
                console.log('user info ',userInfo.id);
                await AsyncStorage.setItem('userId',userInfo.id);
                dispatch({type:'SIGN_UP',userId:userInfo.id});
              }
            },
            userToken:state.userToken,
            userId:state.userId,
      }),
      [state.isLoggedIn, state.userToken ,state.isLoading,state.userInfo,state.userId],
      );
return (
    isFirstLaunch !== null && (
      <ProductsProvider>
        <AuthContext.Provider value={authContext}>
      <NavigationContainer>
      <RootStack.Navigator  screenOptions={{headerShown: false}}>
          {showSplashScreen ? (
            <RootStack.Screen
              name="Splash"
              component={SplashScreen}
              options={{headerShown: false}}
            />
          ) : null}
            {isFirstLaunch && (
              <RootStack.Screen name="onBoarding" component={OnboardingScreen}/>
              )}
              {
              !state.isLoggedIn ? (
                    <>
                    <RootStack.Screen name="login" component={LoginScreen} />
                    <RootStack.Screen name="signup" component={SignUpScreen} />
                    <RootStack.Screen name="forgotPassword" component={ForgotPassword} />
                    <RootStack.Screen name="verification" component={Verification} />
                    <RootStack.Screen name="resetPassword" component={ResetPassword} />
                    </>
              ) : (
                <RootStack.Screen name="home" component={TabNavigation}/>
              )}
      </RootStack.Navigator>
      </NavigationContainer>
        </AuthContext.Provider>
      </ProductsProvider>
      )
    );
  };
export default App;
