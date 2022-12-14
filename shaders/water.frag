#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform float width;
uniform float height;

varying vec3 pos;
const vec3 subColor = vec3(0.0, 1.0, 1.0);
const float THRESHOLD = 50.0;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
	#include <clipping_planes_fragment>

	float mult = map(pos.y, -2.1, 1.6, 0.0, 1.5);

    vec3 newCol = vec3(diffuse + (mult * subColor) );
	// if (pos.y > 1.6){
	// 	newCol = vec3(1.0);
	// }

    float opacityMult = 1.0;

	// Get the pixels near the edge to fade out
	// There's probably a better way for this
    if (pos.x > (width - THRESHOLD)){
        float dist = width - pos.x;
        opacityMult = dist / THRESHOLD * opacityMult;
    }
    if(pos.x < (-width + THRESHOLD)){
        float dist = width + pos.x;
        opacityMult = dist / THRESHOLD * opacityMult;
    }

    if (pos.z > (height - THRESHOLD)){
        float dist = height - pos.z;
        opacityMult = dist / THRESHOLD * opacityMult;
    }
    if (pos.z < (-height + THRESHOLD)){
        float dist = height + pos.z;
        opacityMult = dist / THRESHOLD * opacityMult;
    }
    
	vec4 diffuseColor = vec4( newCol, opacityMult);

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}

