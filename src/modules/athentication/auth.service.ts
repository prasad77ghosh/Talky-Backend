import { IUser, User } from "../user/user.model";

export class AuthService {
    async registerWithUsername({
        input,
    }: {
        input: RegisterType;
    }): Promise<Partial<IUser>> {
        const user = await User.create({
            name: input.name,
            username: input.email,
            password: input.password,
        });

        // send verification email to user email

        // store verification token in redis with expiry time
        

        return user;
    }
}
