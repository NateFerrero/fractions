import { Component } from 'react'
import { connect as reduxConnect } from 'react-redux'

export interface IFluxStandardAction {
  error?: boolean
  meta?: object
  payload?: any
  type: string
}

/**
 * @author Nate Ferrero
 * @description Type for object containing reducers
 */
export type FractionReducers<TComponentState, TComponentActions> = {
  [K in keyof TComponentActions]: ((state: TComponentState, payload?: any, error?: boolean) => Partial<TComponentState>)
}

const reducers: FractionReducers<{}, { [key: string]: object }> = {}
const initialRootState: { [key: string]: object } = {}

/**
 * @author Nate Ferrero
 * @description This is complicated - we are ensuring type information can be passed through to redux
 *              new(props: TComponentState & TComponentActions & TComponentProps): TComponentClass
 *              is a constructor type signature
 */
export const connect = <
  TComponentClass extends Component<TComponentState & TComponentActions & TComponentProps>,
  TComponentState,
  TComponentActions,
  TComponentProps = {}
>(
  ComponentClass: {
    new(props: TComponentState & TComponentActions & TComponentProps): TComponentClass
  },
  initialState: TComponentState,
  actions: FractionReducers<TComponentState, TComponentActions>
) => {
  initialRootState[ComponentClass.name] = initialState as any

  const mapStateToProps = (state: { [key: string]: object }): TComponentState =>
    ComponentClass.name in state ? state[ComponentClass.name] as any : initialState

  const mapDispatchToProps = (dispatch: any) => {
    const actionCreators: Partial<TComponentActions> = {}

    Object.keys(actions)
      .forEach(key => {
        const actionType = `${ComponentClass.name}:${key}`

        actionCreators[key] = (payload: any, error: boolean = false) => {
          const action: IFluxStandardAction = {
            type: actionType
          }

          if (typeof payload !== 'undefined') {
            action.payload = payload
          }

          if (error) {
            action.error = error
          }

          dispatch(action)
        }

        reducers[actionType] = (actions as any)[key]
      })

    return actionCreators as TComponentActions
  }

  return reduxConnect<TComponentState, TComponentActions, TComponentProps>(
    mapStateToProps,
    mapDispatchToProps
  )(ComponentClass)
}

/**
 * @author Nate Ferrero
 * @description the root fractions reducer, to be used with redux's createStore()
 * @param rootState Current redux root state
 * @param action Action to process
 */
export const fractionReducer = (
  rootState: { [key: string]: object } | undefined = {},
  action: IFluxStandardAction
) => {
  if (action.type.indexOf(':') === - 1) {
    return rootState
  }

  const [ namespace ] = action.type.split(':')

  const state = typeof rootState === 'object' &&
    namespace in rootState ?
      rootState[namespace] :
      initialRootState[namespace]

  return {
    ...rootState,
    [namespace]: {
      ...state,
      ...reducers[action.type](state, action.payload, action.error)
    }
  }
}
