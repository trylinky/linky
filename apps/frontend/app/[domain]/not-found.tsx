/**
 * This is the 404 page for the profile pages. It is in a higher directory as we
 * also call notFound from the nested layout file.
 */
export default async function NotFoundPage() {
  return (
    <main className="bg-sys-bg-base">
      <div className="w-full max-w-[768px] mx-auto px-3 md:px-6 gap-3 pt-16 pb-8">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                404 Page Not Found
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  We couldn&apos;t find the page you were looking for. Want to
                  claim this username?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
