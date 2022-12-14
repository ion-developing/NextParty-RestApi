import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entity/user.entity";
import { Repository } from "typeorm";
import { inviteDto } from "../dtos/invite.dto";
import { Party } from "../entity/party.entity";

@Injectable()
export class PartyService{
  constructor(
    @InjectRepository(Party) private partyRepo: Repository<Party>,
    @InjectRepository(User) private userRepo: Repository<User>,) {}

  async getAll() : Promise<Party[]>{
    return await this.partyRepo.find();
  }

  async exists(id: number) {
    const party = await this.partyRepo.findOneBy({ "id": id  });
    return party != null;
  }

  async getById(id: number) : Promise<Party>{
    const party = await this.partyRepo.findOneBy({
      id: id
    });
    if (party == null)
      throw new BadRequestException('Party not found');
    return party;
  }

  // async create(party: Party) {
  //   return await this.partyRepo.save(this.partyRepo.create(party));
  // }

  async update(id: number, party:Party){
    const e = await this.partyRepo.findOneBy({id: id});
    if (!e)
      throw new BadRequestException('Party not found');
    await this.partyRepo.update(id,party);
    return await this.partyRepo.findOneBy({id: id});
  }

  async delete(id: number){
    const e = await this.exists(id);
    if (e)
      throw new BadRequestException('Party not found');
    await this.partyRepo.delete(id);
  }

  async invite(id: number, email: inviteDto){
    var e = await this.partyRepo.findOneBy({id: id});
    if (!e)
      throw new BadRequestException('Party not found');
    const user = await this.userRepo.findOneBy({ email: email.email });
    if (!user)
      throw new BadRequestException('User not found');
    const temp = await this.partyRepo.find({
      relations: ["users"],
      where: [{ "id": id }]
    }
    );
    var party = temp[0]; // party a editar la lista de invitados
    if(party.users.filter(u => u.id == user.id) == null)
      throw new BadRequestException('User already invited');
    const temp2 = await this.userRepo.find({
      relations: ["parties"],
      where: [{ "id": user.id }]
    });
    var guest = temp2[0];
    guest.parties.push(party);
    await this.userRepo.save(guest);
    await this.partyRepo.save(party);

    return user;
  }

  async listUserParties(id: number){
    const user = await this.userRepo.findOneBy({ "id": id });
    if (!user)
      throw new BadRequestException('User not found');
    const temp = await this.userRepo.find({
      relations: ["parties"],
      where: [{ "id": id }]
    });
    return temp[0].parties;
  }

  async listPartyGuests(id: number){
    const party = await this.partyRepo.findOneBy({ "id": id });
    if (!party)
      throw new BadRequestException('Party not found');
    const temp = await this.partyRepo.find({
      relations: ["users"],
      where: [{ "id": id }]
    });
    return temp[0].users;
  }
}
