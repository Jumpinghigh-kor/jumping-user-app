import React, { Component } from 'react';
import Postcode from '@actbase/react-daum-postcode';
import { scale } from '../utils/responsive';

interface SearchAddressProps {
  navigation: any;
}

class SearchAddress extends Component<SearchAddressProps> {
    constructor(props: SearchAddressProps) {
        super(props);
    }
    getAddressData=(data: any)=>{
        let defaultAddress='';
        
        if(data.buildingName==='')
        {
            defaultAddress='';
        }
        else if(data.buildingName==='N')
        {
            defaultAddress="("+data.apartment+")";
        }
        else{
            defaultAddress="("+data.buildingName+")";
        }
        this.props.navigation.navigate('Drawers',{screen:'Deliver', params:{zonecode:data.zonecode, address:data.address, defaultAddress:defaultAddress}});
        
    }
    render() {
        return (
            <Postcode
                style={{ width: '100%', height: '100%' }}
                jsOptions={{ animation: true }}
                onSelected={(data)=>this.getAddressData(data)}
                onError={() => console.log('주소 검색 오류')}
            />
        )
    }
}
export default SearchAddress; 