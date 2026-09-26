import { User } from "./auth.interface";

export interface LoginResponse {
  user:  User;
  accessToken: string;
}
