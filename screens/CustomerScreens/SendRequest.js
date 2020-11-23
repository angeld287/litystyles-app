import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Dimensions, ScrollView, Image, View, ImageBackground } from 'react-native';
import { Container, Header, Content, List, ListItem, Thumbnail, Left, Spinner, Right, Card, CardItem, Text, Icon, Badge } from 'native-base';

import { Button, Block, NavBar, theme, Input } from 'galio-framework';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import { HeaderHeight } from "../../constants/utils";

import moment from 'moment';

import { createRequest, createRequestEmployee, createRequestService } from '../../graphql/mutations';

const { width, height } = Dimensions.get("screen");

const thumbMeasure = (width - 48 - 32) / 3;

const SendRequest = ({ route, navigation }) => {
  const [ loading, setLoading ] = useState(false);
  const [ errorsr, setErrorsr ] = useState(false);
  const [ errorsrm, setErrorsrm ] = useState('no error');

  const { authData, employee, service } = route.params;

  useEffect(() => {
		return () => {
			didCancel = true;
		};
  }, []);


  const sendRequest = async () => {
    const ri = {state: 'ON_HOLD', customerName: authData.attributes.name, customerUsername: authData.username, companyId: employee.companyId};

    const rei = {}
		const rsi = {}
    ri.paymentType = 'CASH';
		ri.resposibleName = employee.username;
		rei.requestEmployeeEmployeeId = employee.id;
		rsi.requestServiceServiceId = service.service.id;
    rsi.cost = service.cost;
    
    try {
      setLoading(true);
      
			var request = {};
			ri.createdAt = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss.SSS')+'Z';
			request = await API.graphql(graphqlOperation(createRequest, {input: ri}));

			rei.requestEmployeeRequestId = request.data.createRequest.id;
			rsi.requestServiceRequestId = request.data.createRequest.id;
			rsi.createdAt = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss.SSS')+'Z';
      rsi.resposibleName = ri.resposibleName;
			await API.graphql(graphqlOperation(createRequestEmployee, {input: rei}));
      await API.graphql(graphqlOperation(createRequestService, {input: rsi}));
      
      navigation.navigate('Homee');
      navigation.navigate('RequestInfo');
      
			setLoading(false);

		} catch (e) {
      setLoading(false);
      setErrorsr(true)
			setErrorsrm('Ha ocurrido un error. Favor intentar mas tarde');
    }
    
  }

  // sleep time expects milliseconds
  function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

 return (
        <Content style={{marginTop: 50, margin: 10}}>
          <Block flex style={styles.profile}>
              <Card>
                <CardItem>
                  <Icon active style={{color: '#d9534f'}}  name="person" />
                  <Text style={{marginLeft: 5}}>Estilista: {employee.name}</Text>
                  <Right>
                  </Right>
                </CardItem>
              </Card>
              <Card>
                <CardItem>
                  <Icon type="Entypo" style={{color: '#0275d8'}} name="scissors" />
                  <Text style={{marginLeft: 5}}>Servicio: {service.service.name}</Text>
                  <Right>
                  </Right>
                </CardItem>
              </Card>
              <Card>
                <CardItem>
                  <Icon type="FontAwesome5" style={{color: '#85bb65'}} name="money-bill-wave" />
                  <Text style={{marginLeft: 5}}>Costo: RD$ {service.cost}</Text>
                  <Right>
                  </Right>
                </CardItem>
              </Card>
              <Button disabled={loading} round style={{ width: '97%', marginTop: 20}} uppercase color="success" onPress={() => {sendRequest()}}>Solicitar</Button>
              
              {loading && <Content>
                <Spinner color='green' />
              </Content>}

              {errorsr && <Content>
                <Badge><Text>{errorsrm}</Text></Badge>
              </Content>}

              <Button disabled={loading} round style={{ width: '97%', marginTop: 5}} uppercase color="danger" onPress={() => { navigation.navigate('Homee')}}>Cancelar</Button>
              <Block style={{marginTop:30}}>
                <Text note>   Tambien puedes agendar una cita:</Text>
                <Button disabled={loading} round style={{ width: '97%'}} uppercase color="warning">Agendar</Button>
              </Block>
          </Block>
        </Content>
 );
}

const styles = StyleSheet.create({
  profile: {
    marginTop: Platform.OS === "android" ? -HeaderHeight : 0,
    // marginBottom: -HeaderHeight * 2,
    flex: 1
  },
  profileContainer: {
    width: width,
    height: height,
    padding: 0,
    zIndex: 1
  },
  profileBackground: {
    width: width,
    height: height / 2
  },
  profileCard: {
    // position: "relative",
    padding: theme.SIZES.BASE,
    marginHorizontal: theme.SIZES.BASE,
    marginTop: 200,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: theme.COLORS.WHITE,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    zIndex: 2
  },
  info: {
    paddingHorizontal: 40
  },
  avatarContainer: {
    position: "relative",
    marginTop: -80
  },
  avatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 0
  },
  nameInfo: {
    marginTop: 35,
    marginBottom: 35
  },
  thumb: {
    borderRadius: 4,
    marginVertical: 4,
    alignSelf: "center",
    width: thumbMeasure,
    height: thumbMeasure
  }
});

export default SendRequest;
