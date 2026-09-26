import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtraerCamposDelTextoDto } from './dto/ExtraerCamposDelTexto.dto';
import { EnumEntidadesVoice } from "../commom/enums/general.enum";
import { parse } from "path";
import { InjectRepository } from "@nestjs/typeorm";
import { Modelo } from "../modelos/entities/modelo.entity";
import { Repository } from "typeorm";

export class IAService{

    private geminiTextoExtraerCampos = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_TEXTO_EXTRAER_CAMPOS);

    private readonly prompts = {
        cliente: `Tu tarea es extraer los datos de un cliente. Campos: nombre, telefono, email. El email lo debes regresar sin acentos y sin espacio. El teléfono lo debes regresar sin espacios.`,
        empresa: `Tu tarea es extraer los datos de una empresa. Campos: nombre, telefono, email. El email lo debes regresar sin acentos y sin espacio. El teléfono lo debes regresar sin espacios.`,
        vehiculo: `Tu tarea es extraer los datos de un vehículo. Campos: marca, modelo, año, placa, color, numero_serie. El número de serie lo debes regresar sin acentos y sin espacio. El modelo debe ser su nombre oficial, por ejemplo: "i10", "HB20", "CR-V", "BR-V" `,
        orden: `Tu tarea es extraer los datos de una orden de servicio. Campos: falla, kilometraje, nivel_gasolina, observaciones.`,
    }

    constructor(
        @InjectRepository(Modelo) private readonly modeloRepository: Repository<Modelo>
    ){}

    async extraerCamposDelTexto( extraerCamposDelTexto: ExtraerCamposDelTextoDto){
        
        const contextPrompt = this.prompts[extraerCamposDelTexto.entidad] || 'Extrae la información relevante';
        
        const model = this.geminiTextoExtraerCampos.getGenerativeModel(
            { 
                model: "gemini-2.5-flash",
                systemInstruction: "Eres un extractor de datos para talleres mecánicos. Solo respondes JSON puro."
            },
        );

        const prompt = `
            Actúa como un asistente experto para un taller mecánico.
            Texto: ${extraerCamposDelTexto.texto}.
            Tarea: ${contextPrompt}
            Instrucciones adicionales:
            - Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, y en letras minúsculas.
            - No uses markdown.
            - Estructura exacta esperada según la entidad.
            - Si no existe un campo, usa null.
        `;

        try{
            
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.1
                }
            }
            );  

            const response = result.response;
            
            const text = response.text();

            const cleanText = text
                                .replace(/```json/g, '')
                                .replace(/```/g, '')
                                .trim();

            let parsed;

            try{

                parsed = JSON.parse( cleanText );

                if( parsed["numero_serie"] && typeof parsed["numero_serie"] === "string" ){

                    parsed["numero_serie"] = parsed["numero_serie"].replace(/\s+/g, '').trim()

                    if( parsed["numero_serie"].length > 10 ){
                        parsed["numero_serie"] = parsed["numero_serie"].slice(-10)
                    }
                }                

            }catch(e){
                console.log("Respuesta inválida de la IA: ", text);
                throw new Error('La IA no devolvió JSON válido');                
            }

            if( extraerCamposDelTexto.entidad == EnumEntidadesVoice.VEHICULO ){
                
                if( parsed['modelo'] != null ){

                    const modelo = await this.modeloRepository.findOne({
                        where: { nombre: parsed["modelo"].trim().toLowerCase() },
                        relations: ['marca']
                    })

                    if( modelo ){

                        parsed["id_modelo"] = modelo.id;
                        parsed["id_marca"] = modelo.marca.id;
                        parsed["marca"] = modelo.marca.nombre;

                    }
                }
                
            }

            return parsed;          

        }catch(error: any){
            console.error('Error llamando a Gemini:', error);
            throw new Error(`No se pudo procesar el texto con IA: ${error.message}`);
        }

    }
}