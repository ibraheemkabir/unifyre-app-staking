import { AnyAction, Dispatch } from "redux";
import { DashboardState, RootState } from "../../../common/RootState";
import { TokenBridgeActions } from "../../TokenBridgeClient";
import { inject, IocModule } from '../../../common/IocModule';
import { addAction, CommonActions } from "../../../common/Actions";
import { TokenBridgeClient } from "../../TokenBridgeClient";
import { SignedPairAddress,UserBridgeWithdrawableBalanceItem } from "../../TokenBridgeTypes";
import { CurrencyList } from "unifyre-extension-web3-retrofit";
import { Network, ValidationUtils } from "ferrum-plumbing";
import { AddressDetails } from "unifyre-extension-sdk/dist/client/model/AppUserProfile";
import { MainBridgeActions } from './../main/main';
import { Connect } from 'unifyre-extension-web3-retrofit';

export const LiquidityActions = {
    AMOUNT_CHANGED: 'AMOUNT_CHANGED',
    TOKEN_SELECTED: 'TOKEN_SELECTED',
    SWAP_DETAILS: 'SWAP_DETAILS',
    SWAP_SUCCESS: 'SWAP_SUCCESS',
    WITHDRAWAL_ITEMS_FETCHED: 'WITHDRAWAL_ITEMS_FETCHED'
};

const Actions = LiquidityActions;

export interface swapDisptach {
    onConnect: (network: string,currency: string, address: string) => void,
    amountChanged: (v?:string) => void,
    executeWithrawItem: (item:UserBridgeWithdrawableBalanceItem) => void,
    tokenSelected: (v?:string,add?: AddressDetails[]) => void,
    onSwap: (amount:string,balance:string,currency:string,targetNet: string,v: (v:string)=>void,y: (v:string)=>void) => Promise<void>
}

export interface swapProps{
    network: string,
    symbol: string,
    baseAddress: string,
    baseSignature: string,
    destAddress: string,
    destNetwork: string,
    baseNetwork: string,
    destSignature: string,
    pairedAddress?: SignedPairAddress,
    amount: string,
    balance: string,
    selectedToken: string,
    addresses: AddressDetails[],
    swapDetails: AddressDetails,
    message: string,
    currency: string,
    availableLiquidity: string,
    messageType: 'error' | 'success',
    currenciesDetails: any,
    userWithdrawalItems: any[]
}

export interface swapState{
    network: string,
    symbol: string,
    baseAddress: string,
    baseSignature: string,
    destAddress: string,
    destSignature: string,
    pairedAddress?: SignedPairAddress,
    amount: string,
    balance: string,
    selectedToken: string,
    destNetwork: string,
    baseNetwork: string,
    addresses: AddressDetails[],
    swapDetails: AddressDetails,
    message: string,
    error:string,
    currency: string,
    messageType: 'error' | 'success',
    currenciesDetails: any,
    availableLiquidity: string,
    userWithdrawalItems: any[]
}

export function mapStateToProps(state:RootState):swapProps  {
    const userProfile = state.data.userData?.profile;
    const addr = userProfile?.accountGroups[0]?.addresses || {};
    const address = addr[0] || {};
    return {
        ...state.ui.swap,
        symbol: address.symbol,
        network: address.network,
        baseAddress: state.ui.swap.baseAddress,
        baseSignature: state.ui.swap.baseSignature,
        destAddress: state.ui.swap.destAddress,
        destSignature: state.ui.swap.destSignature,
        balance: address.balance,
        amount: state.ui.swap?.amount,
        addresses: addr,
        selectedToken: state.ui.swap.selectedToken,
        swapDetails: state.ui.swap.swapDetails,
        destNetwork: state.ui.swap.destNetwork,
        baseNetwork: state.ui.swap.baseNetwork,
        currenciesDetails: state.ui.swap.currenciesDetails,
        currency: address.currency,
        message: state.ui.swap.message,
        messageType: state.ui.swap.messageType,
        availableLiquidity: state.ui.swap.availableLiquidity,
        userWithdrawalItems: state.ui.swap.userWithdrawalItems
    }
}

export const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({
    onConnect: async () => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            const connect = inject<Connect>(Connect);
            const network = connect.network() as any;
            const currenciesList = await sc.getSourceCurrencies(dispatch,network);
            if(currenciesList.length > 0){
                dispatch(addAction(Actions.SWAP_DETAILS,{value: currenciesList}))                
                const currencyList = inject<CurrencyList>(CurrencyList);
                console.log(currencyList,'currencieslist')
                currencyList.set(currenciesList.map((j:any) => j.sourceCurrency));
            }
            const res  = await sc.signInToServer(dispatch);
            const items = await sc.getUserWithdrawItems(dispatch,network);
            if(items.withdrawableBalanceItems.length > 0){
                dispatch(addAction(Actions.WITHDRAWAL_ITEMS_FETCHED,{items: items.withdrawableBalanceItems}));
            }
            return res;
        } catch(e) {
            throw e;
        }finally {
            
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    getLiquidity: async (network: Network,currency: string) => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            const res  = await sc.getAvailableLiquidity(dispatch, network,currency);
            
        } catch(e) {
            throw e;
        }finally {
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            const res = await sc.getUserWithdrawItems(dispatch,network);
            if(res.length > 0)
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    amountChanged: (v?: string) => {
        dispatch(addAction(Actions.AMOUNT_CHANGED,{value: v}));
        dispatch(addAction(MainBridgeActions.CLEAR_ERROR,{}));
    },
    tokenSelected: async (v?: any,addr?: AddressDetails[]) => {
        try{
            let details = addr?.find(e=>e.symbol === v);
            await IocModule.init(dispatch);
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            console.log(addr,'addressedt',details,v)

            if(details){
                console.log(details,'detssss');
                dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
                //get vailable liquidity
                await sc.getAvailableLiquidity(dispatch,details?.address, details?.currency)
            }
            dispatch(addAction(Actions.TOKEN_SELECTED,{value: v || {},details}))
        }catch(e) {
            if(!!e.message){
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.message }));
            }
        }finally {
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }      
    },
    onSwap: async (amount:string,balance:string,currency:string,targetNet: string,v: (v:string)=>void,y: (v:string)=>void) => {
        try {
            const client = inject<TokenBridgeClient>(TokenBridgeClient);        
            ValidationUtils.isTrue(!(Number(balance) < Number(amount) ),'Not anough balance for this transaction');
            const res = await client.swap(dispatch,currency, amount, targetNet);
            if( res === 'success' ){
                y('Swap Successful, Kindly View Withdrawal Items for item checkout.');
                dispatch(addAction(Actions.SWAP_SUCCESS, {message: res }));
                return
            }
            v('error occured')
        }catch(e) {
            if(!!e.message){
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.message }));
            }
        }finally {
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            const res = await sc.getUserWithdrawItems(dispatch,currency);  
            if(res.withdrawableBalanceItems.length > 0){
                dispatch(addAction(Actions.WITHDRAWAL_ITEMS_FETCHED,{items: res.withdrawableBalanceItems}));
            } 
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    },
    executeWithrawItem: async (item:UserBridgeWithdrawableBalanceItem) => {
        try {
            dispatch(addAction(CommonActions.WAITING, { source: 'dashboard' }));
            await IocModule.init(dispatch);
            const sc = inject<TokenBridgeClient>(TokenBridgeClient);
            await sc.withdraw(dispatch,item)
        }catch(e) {
            if(!!e.message){
                dispatch(addAction(TokenBridgeActions.AUTHENTICATION_FAILED, {message: e.message }));
            }
        }finally {
            dispatch(addAction(CommonActions.WAITING_DONE, { source: 'dashboard' }));
        }
    }

} as swapDisptach )

const defaultState = {
    network: '',
    symbol: '',
    baseAddress: '',
    amount: '',
    destAddress: '',
    destSignature: '',
    baseSignature: '',
    balance: '0',
    addresses: [],
    selectedToken: '',
    message: '',
    availableLiquidity: '0',
    currenciesDetails: {}
}

export function reduce(state: any = defaultState, action: AnyAction){
    switch(action.type){
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
                destNetwork: action.payload.pairedAddress.pair?.network2,
                baseNetwork: action.payload.pairedAddress.pair?.network1,
                initialised: true
            }
        case TokenBridgeActions.BRIDGE_AVAILABLE_LIQUIDITY_FOR_TOKEN:
            return {...state,availableLiquidity: action.payload.liquidity}
        case Actions.AMOUNT_CHANGED:
            return {
                ...state, amount: action.payload.value
            }
        case Actions.TOKEN_SELECTED:
            return {
                ...state,selectedToken: action.payload.value,swapDetails: action.payload.details
            }
        case Actions.SWAP_DETAILS:
            return {
                ...state,currenciesDetails: action.payload.value[0]
            }
        case Actions.SWAP_SUCCESS:
            return {...state,message: action.payload.message,messageType: 'success', amount: ''}
        case TokenBridgeActions.AUTHENTICATION_FAILED:
            return {
                ...state,message: action.payload.message,messageType: 'error', amount: ''
            }
        case Actions.WITHDRAWAL_ITEMS_FETCHED:
            return {...state, userWithdrawalItems: action.payload.items}
        default:
            return state;
    }
}

export const Swap = ({
    mapStateToProps,
    mapDispatchToProps,
    reduce
})