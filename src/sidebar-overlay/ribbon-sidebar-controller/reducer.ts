import { combineReducers } from 'redux'

import RootState from './types'
import { reducer as ribbon } from '../ribbon'
import { reducer as sidebar } from '../sidebar'

const rootReducer = combineReducers<RootState>({
    ribbon,
    sidebar,
})

export default rootReducer
