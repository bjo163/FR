import { Client } from "@gradio/client";

const client = await Client.connect("black-forest-labs/FLUX.1-schnell");
const result = await client.predict("/infer", { 		
		prompt: "Hello!!", 		
		seed: 0, 		
		randomize_seed: true, 		
		width: 256, 		
		height: 256, 		
		num_inference_steps: 1, 
});

console.log(result.data);
