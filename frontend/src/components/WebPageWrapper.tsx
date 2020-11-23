import { ActionButton } from '@fluentui/react';
import React from 'react';
import { useHistory } from 'react-router';
import { PageWrapperUtils, ReponsivePageWrapperDispatch, ReponsivePageWrapperProps } from '../base/PageWrapperTypes';
import { ResponsivePageWrapper } from '../base/ResponsivePageWrapper';
import { Utils } from '../common/Utils';
import { useBoolean } from '@uifabric/react-hooks';
import { SidePaneContainer } from './SidePanel';

export function WebPageWrapper(props: {
    children: any, noMainPage?: boolean}&ReponsivePageWrapperProps&ReponsivePageWrapperDispatch) {
    const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
    const history = useHistory();
    const groupId = Utils.getGroupIdFromHref();
    const dektopItems = PageWrapperUtils.platform() === 'desktop' ? (
        <>
            <ActionButton
                allowDisabledFocus
                onClick={openPanel}
            >
                Transactions
            </ActionButton>
        </>
    ) : undefined;
    return (
        <>
        <ResponsivePageWrapper 
            {...props}
            navBarContent={
                <>
                {dektopItems}
                <ActionButton
                    onClick={() => {
                        if (props.noMainPage) {
                            window.location.href = props.homepage!;
                        } else {
                            return history.push('/' + groupId);
                        }
                    }}
                    allowDisabledFocus>
                    Staking Options
                </ActionButton>
                </>
            }
        >
            <SidePaneContainer
                isOpen={isOpen}
                dismissPanel={dismissPanel}
            />
            {props.children}</ResponsivePageWrapper>
        </>
    );
}