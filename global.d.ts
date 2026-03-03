import type { ThreeElements } from "@react-three/fiber";

declare module "*.css";

declare global {
	namespace JSX {
		interface IntrinsicElements extends ThreeElements {}
	}
}
