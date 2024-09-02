import { Field, InputType, Int } from "@nestjs/graphql";
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from "class-validator";
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";
import { availableAgentSorts, availableMemberSorts } from "../../config";
import { Direction } from "../../enums/common.enum";
import { PropertyLocation, PropertyStatus, PropertyType } from "../../enums/property.enum";
import { ObjectId } from "mongoose";


@InputType()
export class PropertyInput {

   @IsNotEmpty()
   @Field(() => PropertyType)
   propertyType:PropertyType

   @IsNotEmpty()
   @Field(() => String)
   propertyLocation:PropertyLocation;

   @IsNotEmpty()
   @Length(3,100)
   @Field(() => String)
   propertyAddress:string

   @IsNotEmpty()
   @Length(3,100)
   @Field(() => String)
   propertyTitle:string

   @IsNotEmpty()
   @Field(() => Number)
   propertyPrice:number

   @IsNotEmpty()
   @Field(() => Number)
   propertySquare:number

   @IsNotEmpty()
   @IsInt()
   @Min(1)
   @Field(() => Int)
   propertyBeds:number

   @IsNotEmpty()
   @IsInt()
   @Min(1)
   @Field(() => Int)
   propertyRooms:number

   @IsNotEmpty()
   @Field(() =>[String])
   propertyImages: string[];

   @IsOptional()
   @Length(5,500)
   @Field(() => String, {nullable:true})
   propertyDesc?:string

   @IsOptional()
   @Field(() => String, {nullable:true})
   propertyBarter?:string

   @IsOptional()
   @Field(() => String, {nullable:true})
   propertyRent?:string

   memberId: ObjectId;

   @IsOptional()
   @Field(() => Date, {nullable:true})
   constructedAt?:Date
}//____________________________________________________________________________________________________
