
export function fetchData(data) {
  return({ type: 'CHANGE_DATA', data})
}

export function changeError(data) {
  return({ type: 'CHANGE_ERROR', data})
}

export function changeLoading(data){
  return({ type: 'CHANGE_LOADING', data})
}

export function changeYear(data){
  return ({type: 'CHANGE_SELECT_YEAR', data})
}

export function changeSelectWord(data){
  return ({type: 'CHANGE_SELECT_WORD', data})
}
