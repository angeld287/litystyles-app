import React, {useEffect , useCallback, useState} from 'react';
import { withNavigation } from '@react-navigation/compat';
import PropTypes from 'prop-types';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import { StyleSheet, Dimensions, Image, TouchableWithoutFeedback, Alert } from 'react-native';
import { Block, theme } from 'galio-framework';
import defaultImage from  '../images/default-image.png';
import GLOBAL from '../global';

import { argonTheme } from '../constants';

import NumericInput from 'react-native-numeric-input'
import { Content, Button, Text, Left, Right, Icon, Body, Spinner } from 'native-base';


const CartItems = (props) => {
  
    const { navigation, item, horizontal, full, style, ctaColor, imageStyle, numeric, remove, quantity, updateQuatity, itemLoading, deleteItem, deleteItemLoading } = props;

    const [ _image , setImage ] = useState('');
    const [ _quantity, setQuatity] = useState(parseInt(item.quantity_requested));
    const [ loading , setLoading ] = useState(true)
    const [ removeLoading , setRemoveLoading ] = useState(false)

    const getImageFromStorage = useCallback(
      async (image) => {
        try {
          if(image !== null) {
              var i = await Storage.get(image, { level: 'public' });
              return i
          }else{
              return defaultImage;
          }
        } catch (e) {
            console.log(e); 
            return defaultImage;
        }
      },
      [],
    );

    const onSelectCompany = () => {
      if (GLOBAL.HAS_REQUEST) {
        Alert.alert("Ya tienes una solicitud creada", "Para poder crear otra solicitud debe finalizar o cancelar la existente.");
      }else{
        navigation.navigate('Office', {id: item.id, loading: true, supplier: item.supplier})
      }
    }

    useEffect(() => {
      async function fetchData() {
          try {
            setLoading(true)
            const img = await getImageFromStorage(props.item.image);
            setImage(img);
            setLoading(false);
          } catch (e) {
            console.log(e);
            setLoading(false);
          }
      }
      fetchData();
    }, [getImageFromStorage]);
    
    const imageStyles = [
      styles.horizontalImage,
      //imageStyle
    ];
    const cardContainer = [styles.card, styles.shadow];
    const imgContainer = [styles.imageContainer,
      horizontal ? styles.horizontalStyles : styles.verticalStyles,
      styles.shadow
    ];

    return (
      <Block row card flex style={cardContainer}>
        <TouchableWithoutFeedback onPress={() => { onSelectCompany() }}>
          <Block>
            <Image source={{uri: _image}} style={imageStyles} />
          </Block>
        </TouchableWithoutFeedback>
          <Block flex space="between" style={styles.cardDescription}>
            <Content>
              <Text>{item.title}</Text>
              <Text note>RD$ {item.cost}</Text>
              { quantity && <Text note>Qty: {item.quantity_requested}</Text>}
            </Content>
            <Block row>
              <Left>
                {(numeric && (itemLoading !== item.id)) && <NumericInput minValue={1} maxValue={item.quantity_available} key={item.id} value={_quantity} onChange={value => {setQuatity(value); updateQuatity(item, value);}} />}
                {( itemLoading === item.id) && <Spinner color='blue' />}
              </Left>
              <Body></Body>
              <Right>
                { remove && <Button danger onPress={(e) => { e.preventDefault(); deleteItem(item); }} transparent>{(deleteItemLoading !== item.id) && <Icon style={{fontSize: 30}} type="MaterialCommunityIcons" name="cart-remove"/>}{(deleteItemLoading === item.id) && <Spinner color='red' style={{marginRight: 10}} />}</Button>}
              </Right>
            </Block>
          </Block>
      </Block>
    );
  
}

CartItems.propTypes = {
  item: PropTypes.object,
  horizontal: PropTypes.bool,
  full: PropTypes.bool,
  ctaColor: PropTypes.string,
  imageStyle: PropTypes.any,
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.WHITE,
    marginVertical: theme.SIZES.BASE,
    borderWidth: 0,
    minHeight: 114,
    marginBottom: 16
  },
  cardTitle: {
    flex: 1,
    flexWrap: 'wrap',
    paddingBottom: 6
  },
  cardDescription: {
    padding: theme.SIZES.BASE / 2
  },
  imageContainer: {
    borderRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  image: {
    // borderRadius: 3,
  },
  horizontalImage: {
    height: 80,
    width: 80,
  },
  horizontalStyles: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  verticalStyles: {
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0
  },
  fullImage: {
    height: 215
  },
  shadow: {
    shadowColor: theme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.1,
    elevation: 2,
  },
});

export default withNavigation(CartItems);