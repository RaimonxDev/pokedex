import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    // Name proviende de extends Document en la clase de Pokemon
    // No confundir con la propiedad name de nuestra clase de pokemon
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>) { }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto)
      return pokemon
    } catch (error) {
      this.handlerError(error, `Create`, `Pokemon is exist in Database`)
    }
  }

  findAll() {
    return `This action returns all pokemon`;
  }

  async findOne(term: string) {
    let pokemon: Pokemon

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term })
    }
    // is Valid ObjectId es propio de moongose, para verificar el id 
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term)
    }
    // si todavia no ha encontrado un pokemon , intentamos la ultima busqueda
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!pokemon) throw new NotFoundException(`Pokemon with id ,name or no "${term}" no found`);


    return pokemon
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne(term)

    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase().trim();
    // {new: true} => nos regresa el nuevo objecto, si no esta especificado devuelve el antiguo object
    try {
      await pokemon.updateOne(updatePokemonDto, { new: true })
      // usamos spread para sobreescribir la informacion del pokemon antes de actualizar
      // con el nuevo request, y asi devolverle al usuario el objecto con los campos actualizados
      // NOTA: Esto sucede siempre y cuando no reviente antes la app
      return { ...pokemon.toJSON(), ...updatePokemonDto }

    } catch (error) {
      this.handlerError(error, `Update`, `Pokemon is Exists, Can't no update`)
    }

  }

  async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id })
    // sino fue eliminado nada devolvemos un error
    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with ${id} not found`)
    }
    return
  }

  private handlerError(error: any, action: string, message: string) {
    if (error.code === 11000) {
      throw new BadRequestException(`${message} ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`Can't no ${action} in database - check internal console.log`)

  }
}
