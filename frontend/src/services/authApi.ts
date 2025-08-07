import { apiService } from "./api";
import { User } from "@/hooks/useAuth";

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthApiService {
  async signup(data: SignupRequest) {
    const response = await apiService.post<AuthResponse>("/auth/signup", data);

    if (response.success && response.data) {
      apiService.setToken(response.data.token);
    }

    return response;
  }

  async signin(data: SigninRequest) {
    const response = await apiService.post<AuthResponse>("/auth/signin", data);

    if (response.success && response.data) {
      apiService.setToken(response.data.token);
    }

    return response;
  }

  async signout() {
    apiService.clearToken();
    window.location.href = "/signin";
    return { success: true };
  }
}

export const authApi = new AuthApiService();
