-- CreateTable for Entries - UPDATED with native DATE and TIME types

CREATE TABLE "Entries" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- UPDATED: Date column should use the native DATE type
    "date" DATE NOT NULL,
    
    -- UPDATED: Time columns should use the native TIME (TIME WITHOUT TIME ZONE) type
    "morning_time_in" TIME NOT NULL,
    "morning_time_out" TIME NOT NULL,
    "afternoon_time_in" TIME NOT NULL,
    "afternoon_time_out" TIME NOT NULL,
    
    -- UPDATED: Optional time columns also use TIME type
    "evening_time_in" TIME,
    "evening_time_out" TIME,
    
    "created_by" TEXT NOT NULL,
    CONSTRAINT "Entries_pkey" PRIMARY KEY ("id")
);