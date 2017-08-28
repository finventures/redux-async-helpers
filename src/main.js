import { combineReducers } from 'redux';
import { Observable } from 'rxjs';

// status constants
export const REQUEST = 'request';
export const SUCCESS = 'success';
export const FAILURE = 'failure';

export const createAsyncAction = (type, promiseCreator) => {
  // get hash of args to pass through to promise creator
  return (args = {}) => (dispatch, getState) => {
    dispatch({ args, type, readyState: REQUEST });

    // pass args through
    let promise = promiseCreator(args);

    // handle thunk-style promises
    if (typeof promise === 'function') {
      promise = promise(dispatch, getState);
    }

    return promise.then(
      data => {
        dispatch({ args, type, readyState: SUCCESS, data });
      },
      error => {
        dispatch({ args, type, readyState: FAILURE, error });
      }
    );
  };
};

export const createAsyncReducer = (type, reducers = {}) => {
  const defaultReducers = {
    loading: (state = false, action) => {
      if (action.type === type) {
        return action.readyState === REQUEST;
      }
      return state;
    },
    data: (state = null, action) => {
      if (action.type === type) {
        return action.data;
      }
      return state;
    },
    error: (state = null, action) => {
      if (action.type === type) {
        return action.error;
      }
      return state;
    },
  };

  return combineReducers(Object.assign({}, defaultReducers, reducers));
};

export const wrapObservableRequest = (type, observable, args = {}) =>
  observable
    .map(result => {
      return { args, type, readyState: SUCCESS, data: result.data };
    })
    .catch(error => Observable.of({ args, type, readyState: FAILURE, error: getError(error) }))
    .startWith({ args, type, readyState: REQUEST });
