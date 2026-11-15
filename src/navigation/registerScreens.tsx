// @flow

import { Navigation } from 'react-native-navigation'

import {
  Home,
  PlayDetail,
  SonglistDetail,
  MylistDetail,
  SourceManager,
  SettingScreen,
} from '@/screens'
import { Provider } from '@/store/Provider'

import {
  HOME_SCREEN,
  PLAY_DETAIL_SCREEN,
  SONGLIST_DETAIL_SCREEN,
  MYLIST_DETAIL_SCREEN,
  SOURCE_MANAGER_SCREEN,
  SETTING_SCREEN,
  // SETTING_SCREEN,
} from './screenNames'

function WrappedComponent(Component: any) {
  return function inject(props: Record<string, any>) {
    const EnhancedComponent = () => (
      <Provider>
        <Component
          {...props}
        />
      </Provider>
    )

    return <EnhancedComponent />
  }
}

export default () => {
  Navigation.registerComponent(HOME_SCREEN, () => WrappedComponent(Home))
  Navigation.registerComponent(PLAY_DETAIL_SCREEN, () => WrappedComponent(PlayDetail))
  Navigation.registerComponent(SONGLIST_DETAIL_SCREEN, () => WrappedComponent(SonglistDetail))
  Navigation.registerComponent(MYLIST_DETAIL_SCREEN, () => WrappedComponent(MylistDetail))
  Navigation.registerComponent(SOURCE_MANAGER_SCREEN, () => WrappedComponent(SourceManager))
  Navigation.registerComponent(SETTING_SCREEN, () => WrappedComponent(SettingScreen))
  // Navigation.registerComponent(SETTING_SCREEN, () => WrappedComponent(Setting))

  console.info('All screens have been registered...')
}
