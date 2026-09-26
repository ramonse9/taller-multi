import { User } from "./auth.interface";

export interface AuthOLDResponse {
  user?:  User;
  accessToken: string;
  //token: string;
}
