import { SelectOutlined } from '@ant-design/icons'
import * as A from 'antd'
import styled from 'styled-components'
import { palette } from 'styled-theme'

import { Button as UIButton } from '../../uielements/button'
import { Label as UILabel } from '../../uielements/label'

export const TitleWrapper = styled.div`
  margin: 0px -8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${palette('background', 1)};
  min-height: 70px;
`

export const Title = styled(UILabel)`
  color: ${palette('text', 1)};
  padding: 0 40px;
  text-transform: uppercase;
  font-family: 'MainFontRegular';
  font-weight: 600;
  font-size: 22px;
  line-height: 22px;
`

export const Divider = styled(A.Divider)`
  margin: 0;
  border-top: 1px solid ${palette('gray', 0)};
`

export const Subtitle = styled(UILabel)`
  margin: 10px 0;
  color: ${palette('text', 0)};
  text-transform: uppercase;
  font-family: 'MainFontRegular';
  font-weight: 600;
  font-size: 18px;
`

export const Row = styled(A.Row)`
  padding: 10px 30px;
  background-color: ${palette('background', 1)};

  .ant-row {
    margin: 0;
  }
`

export const WalletCol = styled(A.Col)`
  width: 100%;
`

export const Card = styled(A.Card)`
  border-radius: 5px;
  background-color: ${palette('background', 1)};
  border: 1px solid ${palette('gray', 0)};
`

export const OptionCard = styled(A.Card)`
  .ant-card-body {
    padding: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${palette('background', 1)};
    width: 100%;
  }
`

export const OptionLabel = styled(UILabel)`
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  font-size: 14px;
  font-family: 'MainFontRegular';
  min-height: 38px;
`

export const Button = styled(UIButton)`
  font-family: 'MainFontRegular';
  text-transform: uppercase;

  span {
    font-size: 14px;
  }

  :disabled:hover {
    color: ${palette('primary', 0)} !important;
  }
`

export const Placeholder = styled(UILabel)`
  display: block;
  padding: 0px;
  color: ${palette('text', 2)};
  font-family: 'MainFontRegular';
  font-size: 14px;
  text-transform: uppercase;
`

export const ClientLabel = styled(UILabel)`
  display: block;
  padding-top: 0px;
  color: ${palette('text', 1)};
  font-family: 'MainFontRegular';
  font-size: 16px;
`

export const ClientButton = styled(UILabel)`
  font-family: 'MainFontRegular';
  text-transform: uppercase;
`

export const AccountCard = styled(A.Card)`
  border: 1px solid ${palette('gray', 0)};

  .ant-card-body {
    padding: 0;
    background-color: ${palette('background', 1)};

    div > div > div > ul > li {
      border-bottom: 1px solid ${palette('gray', 0)};
    }
  }
`

export const ListItem = styled(A.List.Item)`
  padding: 10px 20px;
  flex-direction: column;
  align-items: start;
  border: none;
  border-bottom: 1px solid ${palette('gray', 0)};

  .ant-list-item {
    border-bottom: 1px solid ${palette('gray', 0)};
  }
`

export const ChainName = styled(UILabel)`
  padding: 0px;
  text-transform: uppercase;
  font-weight: normal;
  font-size: 18px;
  line-height: 25px;
  letter-spacing: 2px;
`

export const ChainContent = styled.div`
  margin-left: 30px;
  width: 100%;
`

export const AccountPlaceholder = styled(UILabel)`
  display: block;
  padding: 0px;
  color: ${palette('text', 2)};
  font-family: 'MainFontRegular';
  font-size: 12px;
  text-transform: uppercase;
`

export const AccountContent = styled(UILabel)`
  display: flex;
  align-items: center;
  padding: 0px;
  color: ${palette('text', 1)};
`

export const AccountAddress = styled(UILabel)`
  display: inline-block;
  padding: 0px;
  white-space: nowrap;
  overflow: hidden;
  font-family: 'MainFontRegular';
  font-size: 16px;
  text-overflow: ellipsis;
`

export const DeviceText = styled(UILabel)`
  padding: 0 0 10px;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 16px;
  font-family: 'MainFontRegular';

  span {
    margin-right: 10px;
  }
`

export const ActionMenuItem = styled(A.Menu.Item)`
  background-color: ${palette('background', 1)};
  &:hover {
    background-color: ${palette('background', 2)};
  }
`

export const CopyLabel = styled(A.Typography.Text)`
  text-transform: uppercase;
  font-family: 'MainFontRegular';
  color: ${palette('primary', 0)};
  /* icon */
  svg {
    color: ${palette('primary', 0)};
  }
`

export const Tooltip = styled(A.Tooltip).attrs({
  placement: 'bottom',
  overlayStyle: {
    wordBreak: 'break-all',
    maxWidth: '500px'
  }
})``

export const AddressLinkIcon = styled(SelectOutlined)`
  margin-left: 10px;
  svg {
    height: 16px;
    width: 16px;
    transform: scale(-1, 1) translateX(5px);
    color: ${palette('text', 1)};
  }
`

export const Text = styled(A.Typography.Text)`
  font-size: 16px;
  text-transform: lowercase;
  font-family: 'MainFontRegular';
  color: ${palette('text', 1)};

  .setting-address > div {
    margin-right: 60px;
  }
`
