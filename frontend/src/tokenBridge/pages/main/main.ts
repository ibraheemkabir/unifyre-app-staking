import { AnyAction, Dispatch } from "redux";
import { RootState } from "../../../common/RootState";
import { TokenBridgeActions } from "../../TokenBridgeClient";
import { inject, IocModule } from '../../../common/IocModule';
import { addAction, CommonActions } from "../../../common/Actions";
import { TokenBridgeClient } from "../../TokenBridgeClient";
import { ReponsivePageWrapperDispatch } from "../../../base/PageWrapperTypes";
import { intl } from "unifyre-react-helper";
import { PairAddressService } from "../../PairAddressService";
import { PairedAddress } from "../../TokenBridgeTypes";
import { Connect } from 'unifyre-extension-web3-retrofit';
import { SignedPairAddress } from "./../../TokenBridgeTypes";
import { PairAddressSignatureVerifyre } from "../../PairAddressSignatureVerifyer";

export const MainBridgeActions = {
    BRIDGE_INIT_FAILED: 'BRIDGE_INIT_FAILED',
    BRIDGE_INIT_SUCCEED: 'BRIDGE_INIT_SUCCEED',
    ERROR_OCCURED: 'ERROR_OCCURED',
    CLEAR_ERROR: 'CLEAR_ERROR',
    DEST_NETWORK_CHANGED: 'DEST_NETWORK_CHANGED',
    DEST_ADDRESS_CHANGED: 'DEST_ADDRESS_CHANGED',
    BASE_ADDRESS_SIGNATURE: 'BASE_ADDRESS_SIGNATURE',
    PAIR_ADDRESSES: 'PAIR_ADDRESSES',
    PAIRED_ADDRESSES_SUCCESSFULLY: 'PAIRED_ADDRESSES_SUCCESSFULLY',
    DEST_ADDRESS_SIGNATURE: 'DEST_ADDRESS_SIGNATURE',
    PAIR_VERIFIED: 'PAIR_VERIFIED',
    RESET_PAIR: 'RESET_PAIR',
    ONRECONNECT: 'ONRECONNECT',
    DISCONNECT: 'DISCONNECT'
};

const Actions = MainBridgeActions;

export interface MainProps {
    initialised:boolean,
    connectError: String,
    baseConnected: boolean,
    destConnected: boolean,
    baseSigned: boolean,
    baseSignature: string,
    destSignature: string,
    destSigned: boolean,
    baseAddress: string,
    destAddress: string,
    destNetwork: string,
    pairVerified: boolean,
    symbol: string,
    currency: string,
    network: string,
    baseNetwork: string,
    isPaired: boolean,
    pairedAddress?: PairedAddress,
    signedPairedAddress?: SignedPairAddress,
    connected: boolean
}

export interface MainState {
    initialised:boolean,
    connectError: String,
    baseConnected: boolean,
    destConnected: boolean,
    baseSigned: boolean,
    pairVerified: boolean,
    baseSignature: string,
    destSignature: string,
    destSigned: boolean,
    baseAddress: string,
    destAddress: string,
    destNetwork: string,
    symbol: string,
    currency: string,
    baseNetwork: string,
    network: string,
    isPaired: boolean,
    pairedAddress?: PairedAddress,
    signedPairedAddress: SignedPairAddress,
    connected: boolean
}

export interface MainDispatch extends ReponsivePageWrapperDispatch  {
    signSecondPairAddress: (network1:string,network:string,address: string,baseSign: string) => Promise<void>,
    verifyPairing: (network1:string,network2:string,address: string,address2: string,sign1:string,sign2:string) => void,
    signFirstPairAddress: (network:string,address?: string) => Promise<void>,
    onDestinationNetworkChanged: (v:string) => void,
    onAddressChanged: (v:string) => void,
    resetPair: () => void,
    onReconnect: () => void,
    pairAddresses: (network:string,address: string) => void,
    unPairAddresses: (pair: SignedPairAddress) => void,
    startSwap: (history:any) => void,
}

function mapStateToProps(state:RootState) : MainProps {
    const userProfile = state.data.userData?.profile;
    const addr = userProfile?.accountGroups[0]?.addresses || {};
    const address = addr[0] || {};
    return {
        ...state.ui.bridgeMain,
        symbol: address.symbol,
        network: address.network,
        baseAddress: address.address,
        currency: address.currency,
        initialised: state.ui.bridgeMain.initialised,
        connectError: state.ui.bridgeMain.connectError,
        baseConnected: state.ui.bridgeMain.baseConnected,
        destConnected: state.ui.bridgeMain.destConnected,
        baseSigned: state.ui.bridgeMain.baseSigned,
        destSigned: state.ui.bridgeMain.destSigned,
        destAddress: state.ui.bridgeMain.destAddress,
        pairedAddress: state.ui.bridgeMain.pairedAddress,
        destNetwork: state.ui.bridgeMain.destNetwork
    };

} 

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>, ownProps: any) => ({
    onConnected: async () => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            const res = await sc.signInToServer(dispatch);
            if (res) {
                const connect = inject<Connect>(Connect);
                const network = connect.network() as any;
                const addr = connect.account()!;
                dispatch(addAction(Actions.BRIDGE_INIT_SUCCEED, {data: res,address1: addr,network1: network}));
                ownProps.con()
            } else {
                dispatch(addAction(Actions.BRIDGE_INIT_FAILED, { message: intl('fatal-error-details') }));
            }
            return !!res;
        } catch(e) {
            throw e;
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    onReconnect: async () => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            let connect = inject<Connect>(Connect);
            await connect.connect();
            connect = inject<Connect>(Connect);
            const network = connect.network() as any;
            dispatch(addAction(Actions.ONRECONNECT, {network: network}));
            ownProps.con()
        } catch(e) {
            throw e;
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    pairAddresses: (address2: string, network2:string) => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            dispatch(addAction(Actions.PAIR_ADDRESSES, { address2, network2}))
           
        } catch(e) {
            throw e;
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    verifyPairing: async (network1:string,network2:string,address: string,address2: string,sign1:string,sign2:string) => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            ownProps.con()
            const pair = {
                address1: address,
                address2: address2,
                network1: network1,
                network2: network2,
            }
            let SignedPair = {
                pair,
                signature1: sign1.split('|')[0],
                signature2: sign1.split('|')[0]
            } as  SignedPairAddress
            console.log(SignedPair);
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const vrf = inject<PairAddressSignatureVerifyre>(PairAddressSignatureVerifyre)
            const res = await vrf.verify(SignedPair);
            if (res) {
                const sc = inject<TokenBridgeClient>(TokenBridgeClient);
                await sc.updateUserPairedAddress(dispatch,SignedPair);
                dispatch(addAction(Actions.PAIR_VERIFIED, {data: res}));
            } else {
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: 'An Error Occured.' }));
            }
        } catch(e) {
            if(!!e.message){
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.message }));
            }
            dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.toString() }));
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    signFirstPairAddress: async (network1:string,address2:string) => {
        try {
            const paired = {
                address1: '',
                address2: '',
                network1: 'ETHEREUM',
                network2: network1,
            }
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const connect = inject<Connect>(Connect);
            const network = connect.network() as any;
            const addr = connect.account()!;
            paired.address1 = addr;
            paired.address2 = address2;
            paired.network1 = network;
            const vrf = inject<TokenBridgeClient>(TokenBridgeClient);
            const sc = inject<PairAddressService>(PairAddressService);
            const res = await sc.signPairAddress1(paired);
            let SignedPair = {
                pair: paired,
                signature1: res.split('|')[0],
            } as  SignedPairAddress
            const response = await vrf.updateUserPairedAddress(dispatch,SignedPair);
            if(!!response){
                dispatch(addAction(Actions.BASE_ADDRESS_SIGNATURE,{sign: res,pair: paired}))
            }
        } catch(e) {
             if(!!e.message){
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.message }));
            }
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    signSecondPairAddress: async (network1:string,network2:string,address: string,baseSign: string) => {
        try {
            const paired = {
                address1: '',
                address2: '',
                network1: 'ETHEREUM',
                network2: 'RINKEBY',
            }
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const connect = inject<Connect>(Connect);
            connect.connect()
            const addr = connect.account()!;
            paired.address1 = addr;
            paired.address2 = address;
            paired.network1 = network1;
            paired.network2 = network2;
            const vrf = inject<PairAddressSignatureVerifyre>(PairAddressSignatureVerifyre)
            const sc = inject<PairAddressService>(PairAddressService);
            const tb = inject<TokenBridgeClient>(TokenBridgeClient);
            const res = await sc.signPairAddress2(paired);
            let SignedPair = {
                pair: paired,
                signature2: res.split('|')[0],
                signature1: baseSign.split('|')[0],
            } as  SignedPairAddress
            const response = await vrf.verify(SignedPair);
            const rs = await tb.updateUserPairedAddress(dispatch,SignedPair)
            if(!!response && !!rs){
                dispatch(addAction(Actions.DEST_ADDRESS_SIGNATURE,{sign: res}))
            }
        } catch(e) {
            if(!!e.message){
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.message }));
            }
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    startSwap: async (history:any) => {
        history.replace('/swap');
    },
    resetPair: () => {
        dispatch(addAction(Actions.RESET_PAIR,{}));
        dispatch(addAction(Actions.DISCONNECT, { }));

    },
    unPairAddresses: async (pair: SignedPairAddress) => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const tb = inject<TokenBridgeClient>(TokenBridgeClient);
            const res = await tb.unpairUserPairedAddress(dispatch,pair)
            if(!!res){
                dispatch(addAction(Actions.RESET_PAIR,{}))
            }
        } catch(e) {
            if(!!e.message){
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.message }));
            }
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    onConnectionFailed: (e: Error) => {
    },
    onDisconnected: () => {
    },
    onDestinationNetworkChanged: (v:string) => {
        dispatch(addAction(Actions.DEST_NETWORK_CHANGED,{value:v}))
    },
    onAddressChanged: (v:string) => {
        dispatch(addAction(Actions.DEST_ADDRESS_CHANGED,{value:v}))
    },
} as MainDispatch)

const defaultMainState = {
    initialized: false,
    baseConnected: false,
    destConnected: false,
    baseSigned:false,
    destSigned:false,
    pairVerified: false,
    baseAddress: '',
    destAddress: '',
    destSignature: '',
    baseSignature: '',
    destNetwork: 'ETHEREUM',
    network: 'ETHEREUM',
    pairedAddress: {},
    isPaired: false,
    connected: false,
}

function reduce(state: any = defaultMainState, action: AnyAction){
    switch(action.type) {
        case Actions.BRIDGE_INIT_SUCCEED:
            return {...state, initialised: true,connected: true,fatalError: undefined,error: undefined,pairedAddress:{...state.pairedAddress,address1: action.payload.address1,network1:action.payload.network1}};
        case Actions.ONRECONNECT:
            return {...state,baseNetwork: action.payload.network,connected: true}
        case Actions.PAIR_ADDRESSES:
            return  {...state, pairedAddress:{...state.pairedAddress,address2: action.payload.address2,network2:action.payload.network2}, isPaired: true}
        case Actions.ERROR_OCCURED:
            return {...state, fatalError: action.payload.message};
        case TokenBridgeActions.AUTHENTICATION_FAILED:
            return {...state,error: action.payload.message};
        case TokenBridgeActions.BRIDGE_LIQUIDITY_PAIRED_ADDRESS_RECEIVED:
            return {...state, 
                signedPairedAddress: action.payload.pairedAddress,
                pairedAddress: action.payload.pairedAddress, 
                baseAddress:action.payload.pairedAddress.pair?.address1,
                destAddress:action.payload.pairedAddress.pair?.address2,
                baseSignature: action.payload.pairedAddress.signature1,
                destSignature: action.payload.pairedAddress.signature2,
                isPaired: action.payload.pairedAddress.pair?.address2 ?  true : false,
                baseSigned: action.payload.pairedAddress.signature1 ? true: false,
                network: action.payload.pairedAddress.pair?.network1,
                destNetwok: action.payload.pairedAddress.pair?.network2
            }
        case Actions.DEST_NETWORK_CHANGED:
            return {...state, destNetwork: action.payload.value}
        case Actions.DEST_ADDRESS_CHANGED:
            return {...state, destAddress: action.payload.value}
        case Actions.BASE_ADDRESS_SIGNATURE:
            return {...state, baseSignature: action.payload.sign,baseSigned: true,connected: false,pairedAddresses: {baseSignature: action.payload.sign,pair:action.payload.pair}}
        case Actions.DEST_ADDRESS_SIGNATURE:
            return {...state, destSignature: action.payload.sign,destSigned: true}
        case Actions.RESET_PAIR:
            return {...state, ...defaultMainState, initialised: false}
        case Actions.PAIR_VERIFIED:
            return {...state, pairVerified: true}
        case Actions.DISCONNECT:
            return {...state, connected: false}
        default:
            return state;
    }
}

export const Main = ({
    mapDispatchToProps,
    mapStateToProps,
    reduce
})