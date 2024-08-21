import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberService {

    public async signup():Promise<string>{
        return 'signup';
    }

    public async login():Promise<string>{
        return 'login';
    }

    public async updateMember():Promise<string>{
        return 'updateMember';
    }

    public async getMember():Promise<string>{
        return 'getMember';
    }

    
}
