import React, {useContext, useState} from 'react';
import {
    Row
    // @ts-ignore
} from 'unifyre-web-components';
import {ThemeContext} from 'unifyre-react-helper';
import {formatter,Utils} from '../common/Utils';
import { StakingApp } from "../common/Types";
import { StakeCompletionProgress } from './ProgressBar';
// import ProgressBar from 'react-bootstrap/ProgressBar';
import './categories_view.scss';

interface categoryBtnProps {
    staking: StakingApp,
    userAddress:string
    onStakeNow: () => void
}

export const CategoryBtn = (props:categoryBtnProps) => {
    const theme = useContext(ThemeContext);
    const styles = themedStyles(theme);
    const [expand, setExpand] = useState(false);
    const rewards = Utils.stakingRewards(props.staking);
    const staking = props.staking;
    let btn = (
        <></>
    );
    const state = Utils.stakingState(staking);
    switch (state) {
        case 'stake':
            btn = (
                <a className="rewards" onClick={() => props.onStakeNow()}>
                    Stake Now
                </a>
            );
            break;
        case 'pre-withdraw':
        case 'withdraw':
        case 'maturity':
            btn = (
                <a className="rewards" onClick={() => props.onStakeNow()}>
                    View
                </a>
            );
            break;
    }
    const progressBar = state === 'stake' ? (
        <>
        <div className="miniText2">
            staking is open
        </div>
        <StakeCompletionProgress thin={true} completion={Utils.stakeProgress(props.staking)} />
        </>
    ) : undefined;
    const backgroundStyle = props.staking.backgroundImage ? {...styles.containerBackgroundImage,
        backgroundImage: `url("${props.staking.backgroundImage}")`} : {};
    return (
        <div className="web-categories">
        <Row withPadding noMarginTop>
            <div style={
                    Object.assign({...styles.Container}, staking.color ? { backgroundColor: staking.color, }
                        : {}, backgroundStyle)}
                    className={`${expand ? 'container' : 'collapsed'}`}
                    
            >
                <div className="btnContainer">
                    <a className="tokenInfo">
                        <div className="tokenSymbol">
                            <img
                                style={{"width":'50px'}}
                                src={staking.logo || Utils.icon(staking.currency)}
                            />
                        </div>
                        <div className="cat_text_container">
                            <div className="cat_categoryText">
                                {Utils.ellipsis(props.staking.name, 20)}
                            </div>
                            {progressBar}
                        </div>
                    </a> 
                    <div className="percent">
                        <div className="symb">
                            {`${rewards.maturityAnnual }%`}
                        </div>
                    </div>
                </div>
                <div className="stakingCapText">
                    {formatter.format(props.staking.stakingCap, true)} {props.staking.symbol}
                    {btn}
                </div>
                <div className="progessBarContainer">
                    {/* <ProgressBar animated now={100}></ProgressBar> */}
                </div>
            </div>
        </Row>
        </div>
       
    )
}

//@ts-ignore
const themedStyles = (theme) => ({
    Container: {
        display: 'relative',
        borderRadius: '10px',
        width: '100%',
        marginBottom: '25px',
        boxShadow: '0 0 15px 0 #bababa',
        padding: '30px'
    },
    containerBackgroundImage: {
        backgroundImage: '',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
    },
});