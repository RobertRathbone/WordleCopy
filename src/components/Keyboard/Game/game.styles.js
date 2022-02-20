import { StyleSheet } from "react-native";
import { colors } from "../../../constants";

export default StyleSheet.create({
    map: {
      alignSelf: 'stretch',
      height: 560,
    },
    row: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      justifyContent: 'center',
  
    },
    cell:{
      borderWidth: 3,
      borderColor: colors.darkgrey,
      flex: 1,
      maxWidth: 60,
      aspectRatio: 1,
      margin:5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cellText: {
      color: colors.lightgrey,
      fontSize: 26,
      fontWeight: 'bold',
    },
  });