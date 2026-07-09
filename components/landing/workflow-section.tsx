export default function WorkflowSection() {
  return (
    <section id="workflow" className=" border-b py-20 lg:py-28">
        <div className="workflow max-w-6xl px-6 mx-auto grid md:grid-cols-[0.9fr_1.1fr] gap-5 items-stretch py-4">
          <div className="workflow-copy p-10 rounded-lg text-secondary-foreground bg-secondary">
            <div className="eyebrow inline-flex items-center gap-2 mb-5 text-sm font-extrabold uppercase before:content-[''] before:w-[34px] before:h-[2px] before:bg-primary">From idea to defense</div>
            <h2 className="text-3xl lg:text-4xl tracking-tight text-balance font-extrabold mb-4">Designed around the way final-year projects actually unfold.</h2>
            <p className='text-muted-foreground text-justify'>
              The platform keeps students moving, supervisors informed, and
              departments accountable from the first idea search to the final
              presentation room.
            </p>
          </div>
          <div className="steps grid gap-3">
            <article className="step grid grid-cols-[48px_1fr] gap-4 items-start p-5 border rounded-lg">
              <div className="step-number grid place-items-center w-[42px] h-[42px] rounded-lg bg-primary text-primary-foreground font-black">1</div>
              <div>
                <h3 className='mb-2 text-lg font-semibold'>Discover and validate</h3>
                <p className='text-muted-foreground'>
                  Generate original ideas, rate feasibility, check duplicates, and
                  identify research gaps from uploaded literature.
                </p>
              </div>
            </article>
            <article className="step grid grid-cols-[48px_1fr] gap-4 items-start p-5 border rounded-lg">
              <div className="step-number grid place-items-center w-[42px] h-[42px] rounded-lg bg-primary text-primary-foreground font-black">2</div>
              <div>
                <h3 className='mb-2 text-lg font-semibold'>Write and submit</h3>
                <p className='text-muted-foreground'>
                  Draft proposals and chapters, manage references, upload documents,
                  and submit work through governed approval flows.
                </p>
              </div>
            </article>
            <article className="step grid grid-cols-[48px_1fr] gap-4 items-start p-5 border rounded-lg">
              <div className="step-number grid place-items-center w-[42px] h-[42px] rounded-lg bg-primary text-primary-foreground font-black">3</div>
              <div>
                <h3 className='mb-2 text-lg font-semibold'>Review and improve</h3>
                <p className='text-muted-foreground'>
                  Supervisors annotate submissions, schedule meetings, apply
                  rubrics, and help students resolve corrections on time.
                </p>
              </div>
            </article>
            <article className="step grid grid-cols-[48px_1fr] gap-4 items-start p-5 border rounded-lg">
              <div className="step-number grid place-items-center w-[42px] h-[42px] rounded-lg bg-primary text-primary-foreground font-black">4</div>
              <div>
                <h3 className='mb-2 text-lg font-semibold'>Measure and defend</h3>
                <p className='text-muted-foreground'>
                  Track progress, detect risk, prepare summaries, export reports,
                  and support evaluation through the final defense.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
  )
}
