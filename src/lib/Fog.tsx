import * as THREE from "three";
import * as React from "react";
import * as FIBER from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import { Noise } from "./Noise";

interface FogProps {
  color: THREE.ColorRepresentation;
  density: number;
  speed: number;
  distortion: number;
  direction: FIBER.Vector3;
  scale: FIBER.Vector3;
  position: FIBER.Vector3;
}

type FogExp2Porps = FIBER.NodeProps<THREE.FogExp2, typeof THREE.FogExp2>;

export default function Fog({
  color = 0xffffff,
  density = 0.1,
  speed = 1,
  distortion = 1,
  direction = [1, 0, 0],
  scale = [1, 1, 1],
  position = [0, 0, 0],
  ...props
}: FogExp2Porps & FogProps) {
  React.useLayoutEffect(() => {
    THREE.ShaderChunk.fog_fragment = `
    #ifdef USE_FOG
      vec3 size = uFogScale;
      float fogFactor = 1. - sdBox(vWorldPosition + uFogPosition, size);
      fogFactor = pow(fogFactor, 0.5);


      vec3 fogOrigin = cameraPosition;
      vec3 fogDirection = normalize(vWorldPosition - fogOrigin);
      float fogDepth = distance(vWorldPosition, fogOrigin);
      float expFactor = (1.0 - exp(-fogDensity * fogDensity * fogDepth * fogDepth));

      vec3 noiseSampleCoord = (vWorldPosition * 0.025);
      float n = FBM(noiseSampleCoord + FBM(noiseSampleCoord + (uFogDirection * uFogTime * 0.025 * uFogSpeed))) * 0.5 + 0.5;
      n = 1. - (n * uFogDistortion);
      
      fogFactor *= expFactor * n;
      fogFactor = clamp(fogFactor * fogDensity * 5., 0., 1.);

      gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
      // gl_FragColor.rgb = vec3(n);

    #endif`;

    THREE.ShaderChunk.fog_pars_fragment = `
      uniform float uFogTime;
      uniform float uFogDistortion;
      uniform float uFogSpeed;
      uniform vec3 uFogDirection;
      uniform vec3 uFogScale;
      uniform vec3 uFogPosition;

      uniform vec3 fogColor;
      varying vec3 vWorldPosition;
      uniform float fogDensity;

      float custom_map(float value, float min1, float max1, float min2, float max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
      }
      
      float sdBox( vec3 p, vec3 b ) {
        vec3 q = abs(p) - b;
        return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
      }

      ${Noise}
      `;

    THREE.ShaderChunk.fog_pars_vertex = `
      varying vec3 vWorldPosition;
    `;
    THREE.ShaderChunk.fog_vertex = `
      vWorldPosition = worldPosition.xyz;
    `;
  }, []);

  const args = React.useMemo<any>(() => [color, density], [color, density]);

  const shaders = React.useRef([]);
  const scene = useThree((s) => s.scene);

  React.useEffect(() => {
    shaders.current.forEach((s) => (s.uniforms.uFogSpeed.value = speed));
  }, [speed]);
  React.useEffect(() => {
    shaders.current.forEach(
      (s) => (s.uniforms.uFogDistortion.value = distortion)
    );
  }, [distortion]);
  React.useEffect(() => {
    shaders.current.forEach((s) => (s.uniforms.fogDensity.value = density));
  }, [density]);

  React.useEffect(() => {
    shaders.current.forEach((s) => {
      if (Array.isArray(direction) && direction.length >= 3) {
        s.uniforms.uFogDirection.value = new THREE.Vector3().fromArray(
          direction
        );
      } else if (direction instanceof THREE.Vector3) {
        s.uniforms.uFogDirection.value = direction;
      }
    });
  }, [direction]);

  React.useEffect(() => {
    shaders.current.forEach((s) => {
      if (Array.isArray(scale) && scale.length >= 3) {
        s.uniforms.uFogScale.value = new THREE.Vector3().fromArray(scale);
      } else if (scale instanceof THREE.Vector3) {
        s.uniforms.uFogScale.value = scale;
      }
    });
  }, [scale]);

  React.useEffect(() => {
    shaders.current.forEach((s) => {
      if (Array.isArray(position) && position.length >= 3) {
        s.uniforms.uFogPosition.value = new THREE.Vector3().fromArray(position);
      } else if (position instanceof THREE.Vector3) {
        s.uniforms.uFogPosition.value = position;
      }
    });
  }, [position]);

  useFrame(({ clock }) => {
    shaders.current.forEach(
      (s) => (s.uniforms.uFogTime.value = clock.elapsedTime)
    );
  });

  React.useEffect(() => {
    scene.traverse((obj) => {
      // @ts-ignore
      if (obj.material) {
        const m = obj as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.MeshStandardMaterial
        >;
        m.material.onBeforeCompile = (s) => {
          s.uniforms.uFogTime = { value: 0 };
          s.uniforms.uFogSpeed = { value: speed };
          s.uniforms.uFogDistortion = { value: distortion };
          s.uniforms.uFogDirection = {
            value: new THREE.Vector3().fromArray(
              direction as THREE.Vector3Tuple
            )
          };
          s.uniforms.uFogScale = {
            value: new THREE.Vector3().fromArray(scale as THREE.Vector3Tuple)
          };
          s.uniforms.uFogPosition = {
            value: new THREE.Vector3().fromArray(position as THREE.Vector3Tuple)
          };
          shaders.current.push(s);
        };
      }
    });
  }, []);

  return <fogExp2 args={args} {...props} />;
}
