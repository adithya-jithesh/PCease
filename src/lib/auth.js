// src/lib/auth.js
import { login as apiLogin, register as apiRegister } from "../shared/api.js";

// ===== Session Handling =====
export function getSession() {
  try {
    return JSON.parse(localStorage.getItem("pc_session")) || null;
  } catch {
    return null;
  }
}

export function setSession(data) {
  if (data) localStorage.setItem("pc_session", JSON.stringify(data));
  else localStorage.removeItem("pc_session");
}

export function isLoggedIn() {
  return !!getSession();
}

export function getToken(){
  return getSession()?.token || '';
}

export function logout() {
  localStorage.removeItem("pc_session");
}

// ===== API Integration =====
export async function login(username, password) {
  const res = await apiLogin(username, password);
  setSession({ username, token: res.token });
  return res;
}

export async function register(username, password) {
  const res = await apiRegister(username, password);
  return res;
}
