/**
 * Shows a plan written in the editor. The HTML is cleaned by the server before it is
 * stored (formatting tags only, no attributes), so it is safe to render as-is.
 */
export default function PlanContent({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`plan-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
