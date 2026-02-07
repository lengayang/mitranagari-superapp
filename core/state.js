const sessions = {};

export function getState(user){
  if(!sessions[user]){
    sessions[user] = { mode:"AI" };
  }
  return sessions[user];
}

export function setMode(user,mode){
  sessions[user].mode = mode;
}
