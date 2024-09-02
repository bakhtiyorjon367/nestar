import { Resolver } from '@nestjs/graphql';
import { PropertyService } from './property.service';

@Resolver()
export class PropertyResolver {
    constructor(private readonly propertyService: PropertyService) {}

    // @Mutation(() => Member)
    // public async signup(@Args('input') input:MemberInput): Promise<Member>{
    //     console.log("Mutation: signup ");
    //     return await this.memberService.signup(input);
    // }//__________________________________________________________________________



}
