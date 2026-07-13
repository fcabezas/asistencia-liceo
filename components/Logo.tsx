/**
 * Marca de reemplazo mientras se integra el logo oficial del liceo (archivo
 * de imagen real). Reproduce la paleta del escudo: azul marino + dorado.
 */
export default function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 44"
      className={className}
      role="img"
      aria-label="Liceo Eduardo Charme"
    >
      <path
        d="M20 0 38 6V20C38 30 30.5 39 20 44 9.5 39 2 30 2 20V6Z"
        fill="var(--color-brand-700)"
      />
      <path
        d="M20 3 35 8V20C35 28.5 28.5 36 20 40.5 11.5 36 5 28.5 5 20V8Z"
        fill="var(--color-brand-900)"
        opacity="0.35"
      />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="var(--color-gold-400)"
        fontFamily="Arial, sans-serif"
      >
        ECH
      </text>
    </svg>
  );
}
