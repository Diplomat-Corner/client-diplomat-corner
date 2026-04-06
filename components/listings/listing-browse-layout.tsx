"use client";

import CardHouse from "@/components/house/card-house";
import CardCar from "@/components/car/car-card";
import FilterSection from "@/components/filter-section";
import ListingBanner from "@/components/listing-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ICar } from "@/lib/models/car.model";
import type { IHouse } from "@/lib/models/house.model";
import {
  Car,
  ChevronDown,
  Filter,
  House,
  Loader2,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ListingPageSkeleton from "@/components/listings/listing-page-skeleton";
import type { ListingBrowseContext } from "@/components/listings/useListingBrowse";

export default function ListingBrowseLayout({
  ctx,
}: {
  ctx: ListingBrowseContext;
}) {
  const {
    mode,
    advertisementType,
    userId,
    user,
    items,
    userItems,
    loading,
    error,
    filterOpen,
    setFilterOpen,
    sortOrder,
    activeFilters,
    isSelectOpen,
    setIsSelectOpen,
    selectRef,
    activeTab,
    setActiveTab,
    filterOptions,
    sortOptions,
    getCurrentSortLabel,
    handleSortChange,
    handleFilterChange,
    handleSearchResultSelect,
    loadMore,
    bannerTitle,
    listingsHeading,
    showLoadMore,
    countLabel,
    isLoadingMore,
    currentPage,
  } = ctx;

  const bannerType: "house" | "car" = mode === "house" ? "house" : "car";

  if (loading && currentPage === 1) {
    return <ListingPageSkeleton variant={mode} />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 relative z-30">
        <div className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-4 px-2 py-4">
          <ListingBanner type={bannerType} title={bannerTitle} />
          <div className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5B8F2D]"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    filterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div className="text-sm text-gray-500">{countLabel}</div>
            </div>

            <div className="relative z-40" ref={selectRef}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className="flex items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-green-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 group min-w-[180px]"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    size={16}
                    className="text-gray-500 group-hover:text-green-500 transition-colors"
                  />
                  <span className="font-medium">{getCurrentSortLabel()}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-300 ${
                    isSelectOpen ? "rotate-180" : ""
                  }`}
                />
              </motion.button>

              <AnimatePresence>
                {isSelectOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                    style={{
                      minWidth: "220px",
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    <div className="py-1">
                      {sortOptions.map((option) => (
                        <motion.button
                          type="button"
                          key={option.value}
                          whileHover={{
                            x: 4,
                            backgroundColor: "rgba(34, 197, 94, 0.05)",
                          }}
                          onClick={() => {
                            handleSortChange(option.value);
                            setIsSelectOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between ${
                            sortOrder === option.value
                              ? "bg-green-50 text-green-600"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortOrder === option.value && (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                              className="bg-green-100 rounded-full p-0.5"
                            >
                              <Check size={14} className="text-green-600" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {filterOpen && (
            <div className="mt-4">
              <FilterSection
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                filterOptions={filterOptions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onSearchResultSelect={handleSearchResultSelect}
                showSearchResults={true}
                modelType={mode}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-4 px-2 py-6 relative z-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "listings" | "your-listing")
          }
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-gray-100">
            <TabsTrigger
              value="listings"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Listings
            </TabsTrigger>
            <TabsTrigger
              value="your-listing"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Your Listing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="your-listing" className="mt-0">
            {userId ? (
              userItems.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    Your Listed Properties
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {mode === "house"
                      ? (userItems as IHouse[]).map((house) => (
                          <CardHouse
                            key={house._id}
                            {...house}
                            listedBy={user?.firstName || "Unknown User"}
                          />
                        ))
                      : (userItems as ICar[]).map((car) => (
                          <CardCar
                            key={car._id}
                            {...car}
                            listedBy={user?.firstName || "Unknown User"}
                          />
                        ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  {mode === "house" ? (
                    <House className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  ) : (
                    <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  )}
                  <p className="text-xl font-semibold text-gray-600 mb-2">
                    No listings so far
                  </p>
                  <p className="text-gray-500">
                    {mode === "house"
                      ? "You haven't created any house listings yet."
                      : "You haven't created any car listings yet."}
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500">
                  Please sign in to view your listings
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="listings" className="mt-0">
            <div>
              <h2 className="text-2xl font-bold mb-4">{listingsHeading}</h2>
              {error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : mode === "car" && items.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No cars found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {mode === "house"
                      ? (items as IHouse[]).map((house) => (
                          <CardHouse
                            key={house._id}
                            {...house}
                            listedBy={user?.firstName || "Unknown User"}
                          />
                        ))
                      : (items as ICar[]).map((car) => (
                          <CardCar
                            key={car._id}
                            {...car}
                            listedBy={user?.firstName || "Unknown User"}
                          />
                        ))}
                  </div>

                  {showLoadMore && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-3 text-sm font-medium text-white bg-[#5B8F2D] rounded-lg hover:bg-[#4A7324] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5B8F2D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
